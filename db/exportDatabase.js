import { STORES } from '../config/constants.js';
import { getAllRecords } from './getAllRecords.js';

export async function exportDatabase() {
  const [accounts, categories, transactions, stockTrades, stockPrices] = await Promise.all([
    getAllRecords(STORES.ACCOUNTS),
    getAllRecords(STORES.CATEGORIES),
    getAllRecords(STORES.TRANSACTIONS),
    getAllRecords(STORES.STOCK_TRADES),
    getAllRecords(STORES.STOCK_PRICES)
  ]);

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  const payload = {
    version: 2,
    exportedAt: now.toISOString(),
    data: { accounts, categories, transactions, stockTrades, stockPrices }
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `MoneyBook-${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}