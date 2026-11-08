import { STORES } from '../config/constants.js';
import { openDB } from './openDB.js';

export async function importDatabase(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (!parsed?.data?.accounts || !parsed?.data?.categories || !parsed?.data?.transactions) {
    throw new Error('備份檔案格式不正確');
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const storeNames = [
      STORES.ACCOUNTS,
      STORES.CATEGORIES,
      STORES.TRANSACTIONS,
      STORES.STOCK_TRADES,
      STORES.STOCK_PRICES
    ];
    const tx = db.transaction(storeNames, 'readwrite');

    storeNames.forEach((name) => tx.objectStore(name).clear());

    parsed.data.accounts.forEach((acc) => {
      acc.initialBalance = Math.round(Number(acc.initialBalance) || 0);
      tx.objectStore(STORES.ACCOUNTS).put(acc);
    });

    parsed.data.categories.forEach((cat) => {
      tx.objectStore(STORES.CATEGORIES).put(cat);
    });

    parsed.data.transactions.forEach((rec) => {
      rec.amount = Math.max(1, Math.round(Number(rec.amount) || 1));
      tx.objectStore(STORES.TRANSACTIONS).put(rec);
    });

    if (Array.isArray(parsed.data.stockTrades)) {
      parsed.data.stockTrades.forEach((trade) => {
        tx.objectStore(STORES.STOCK_TRADES).put(trade);
      });
    }

    if (Array.isArray(parsed.data.stockPrices)) {
      parsed.data.stockPrices.forEach((priceItem) => {
        tx.objectStore(STORES.STOCK_PRICES).put(priceItem);
      });
    }

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}