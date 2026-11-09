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
  // 台股收盤與盤後資料結算完成時間約為 14:00~14:30，以 14:30 作為當日收盤價更新分界
  const isAfterMarketClose = hours > 14 || (hours === 14 && minutes >= 30);

  const day = target.getDay();
  if (day === 0) {
    // 週日 -> 目標為週五收盤價
    target.setDate(target.getDate() - 2);
  } else if (day === 6) {
    // 週六 -> 目標為週五收盤價
    target.setDate(target.getDate() - 1);
  } else if (!isAfterMarketClose) {
    // 平日尚未收盤結算 -> 沿用上一個交易日收盤價
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

export async function syncDailyStockPrices(forceSymbol = null) {
  const targetCloseDate = getTargetCloseDateStr();
  const priceMap = new Map(store.stockPrices.map((p) => [p.symbol, p]));

  const symbolsToCheck = new Set();

  if (forceSymbol) {
    symbolsToCheck.add(String(forceSymbol).trim().toUpperCase());
  } else {
    const heldSharesMap = new Map();
    for (const trade of store.stockTrades) {
      const sym = trade.symbol;
      const prev = heldSharesMap.get(sym) || 0;
      heldSharesMap.set(sym, trade.type === 'buy' ? prev + trade.shares : prev - trade.shares);
    }
    for (const [sym, shares] of heldSharesMap.entries()) {
      if (shares > 0) symbolsToCheck.add(sym);
    }
  }

  let updatedAny = false;

  for (const sym of symbolsToCheck) {
    const cached = priceMap.get(sym);

    // 若快取已由 FinMind 查過目標收盤日，直接沿用，不再發送請求
    if (
      !forceSymbol &&
      cached &&
      cached.provider === 'finmind' &&
      cached.checkedForDate >= targetCloseDate
    ) {
      continue;
    }

    const fetched = await fetchStockPrice(sym);
    if (fetched) {
      await updateRecord(STORES.STOCK_PRICES, {
        id: sym,
        symbol: sym,
        provider: 'finmind',
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