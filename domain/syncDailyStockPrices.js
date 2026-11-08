import { STORES } from '../config/constants.js';
import { store } from '../state/store.js';
import { refreshData } from '../state/refreshData.js';
import { updateRecord } from '../db/updateRecord.js';
import { fetchStockPrice } from './fetchStockPrice.js';

function getTargetCloseDateStr() {
  const now = new Date();
  const target = new Date(now);
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isAfterMarketClose = hours > 13 || (hours === 13 && minutes >= 45);

  const day = target.getDay();
  if (day === 0) {
    // 週日 -> 取週五
    target.setDate(target.getDate() - 2);
  } else if (day === 6) {
    // 週六 -> 取週五
    target.setDate(target.getDate() - 1);
  } else if (!isAfterMarketClose) {
    // 平日但尚未 13:45 收盤 -> 取上一個交易日
    if (day === 1) {
      // 週一盤中 -> 取上週五
      target.setDate(target.getDate() - 3);
    } else {
      target.setDate(target.getDate() - 1);
    }
  }

  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function syncDailyStockPrices(forceSymbol = null) {
  const targetCloseDate = getTargetCloseDateStr();
  const priceMap = new Map(store.stockPrices.map((p) => [p.symbol, p]));

  // 收集目前有庫存（或強制指定更新）的股票代號
  const heldSharesMap = new Map();
  for (const trade of store.stockTrades) {
    const sym = trade.symbol;
    const prev = heldSharesMap.get(sym) || 0;
    heldSharesMap.set(sym, trade.type === 'buy' ? prev + trade.shares : prev - trade.shares);
  }

  const symbolsToCheck = new Set();
  for (const [sym, shares] of heldSharesMap.entries()) {
    if (shares > 0) symbolsToCheck.add(sym);
  }
  if (forceSymbol) {
    symbolsToCheck.add(String(forceSymbol).trim().toUpperCase());
  }

  let updatedAny = false;

  for (const sym of symbolsToCheck) {
    const cached = priceMap.get(sym);
    // 若快取已記錄該目標收盤日查過，直接沿用，不再發送網路請求
    if (!forceSymbol && cached && cached.checkedForDate >= targetCloseDate) {
      continue;
    }

    const fetched = await fetchStockPrice(sym, cached?.yahooSymbol);
    if (fetched) {
      await updateRecord(STORES.STOCK_PRICES, {
        id: sym,
        symbol: sym,
        yahooSymbol: fetched.yahooSymbol,
        price: fetched.price,
        tradeDate: fetched.tradeDate,
        checkedForDate: targetCloseDate,
        updatedAt: Date.now()
      });
      updatedAny = true;
    }
  }

  if (updatedAny) {
    await refreshData();
  }
}