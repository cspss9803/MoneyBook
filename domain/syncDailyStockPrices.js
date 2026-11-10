import { STORES } from '../config/constants.js';
import { store } from '../state/store.js';
import { refreshData } from '../state/refreshData.js';
import { updateRecord } from '../db/updateRecord.js';
import { fetchStockPrices } from './fetchStockPrice.js';

function getTargetCloseDateStr() {
  const now = new Date();
  const target = new Date(now);
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isAfterMarketClose = hours > 14 || (hours === 14 && minutes >= 30);

  const day = target.getDay();
  if (day === 0) {
    target.setDate(target.getDate() - 2);
  } else if (day === 6) {
    target.setDate(target.getDate() - 1);
  } else if (!isAfterMarketClose) {
    if (day === 1) {
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

export async function syncDailyStockPrices(forceOption = null) {
  const targetCloseDate = getTargetCloseDateStr();
  const priceMap = new Map(store.stockPrices.map((p) => [p.symbol, p]));

  const symbolsToCheck = [];

  if (typeof forceOption === 'string' && forceOption.trim()) {
    // 指定強制更新單一股票代號
    symbolsToCheck.push(forceOption.trim().toUpperCase());
  } else {
    const forceAll = forceOption === true;
    const heldSharesMap = new Map();
    for (const trade of store.stockTrades) {
      const sym = trade.symbol;
      const prev = heldSharesMap.get(sym) || 0;
      heldSharesMap.set(sym, trade.type === 'buy' ? prev + trade.shares : prev - trade.shares);
    }
    for (const [sym, shares] of heldSharesMap.entries()) {
      if (shares > 0) {
        const cached = priceMap.get(sym);
        if (
          !forceAll &&
          cached &&
          cached.provider === 'gas' &&
          cached.checkedForDate >= targetCloseDate
        ) {
          continue;
        }
        symbolsToCheck.push(sym);
      }
    }
  }

  if (symbolsToCheck.length === 0) return;

  // 一次性批次查詢所有需要更新的股票
  const results = await fetchStockPrices(symbolsToCheck);
  let updatedAny = false;

  for (const fetched of results) {
    if (fetched && fetched.price > 0) {
      await updateRecord(STORES.STOCK_PRICES, {
        id: fetched.symbol,
        symbol: fetched.symbol,
        provider: 'gas',
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