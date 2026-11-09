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

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function syncDailyStockPrices(forceSymbol = null) {
  const targetCloseDate = getTargetCloseDateStr();
  const priceMap = new Map(store.stockPrices.map((p) => [p.symbol, p]));

  const symbolsToCheck = new Set();

  if (forceSymbol) {
    // 若指定更新單一股票，僅查詢該檔股票，避免重複發送其他股票請求
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
  let isFirstRequest = true;

  for (const sym of symbolsToCheck) {
    const cached = priceMap.get(sym);

    // 非強制更新時，若已查過目標收盤日，且抓到的收盤日期已達目標日，直接沿用快取
    if (
      !forceSymbol &&
      cached &&
      cached.checkedForDate >= targetCloseDate &&
      cached.tradeDate >= targetCloseDate
    ) {
      continue;
    }

    // 多檔股票依序查詢時稍微間隔 350ms，避免觸發免費 Proxy 的瞬間併發封鎖
    if (!isFirstRequest) {
      await delay(350);
    }
    isFirstRequest = false;

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