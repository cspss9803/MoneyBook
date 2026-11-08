import { STORES } from '../config/constants.js';
import { getAllRecords } from '../db/getAllRecords.js';
import { setState } from './setState.js';

export async function refreshData() {
  const [accounts, categories, transactions, stockTrades, stockPrices] = await Promise.all([
    getAllRecords(STORES.ACCOUNTS),
    getAllRecords(STORES.CATEGORIES),
    getAllRecords(STORES.TRANSACTIONS),
    getAllRecords(STORES.STOCK_TRADES),
    getAllRecords(STORES.STOCK_PRICES)
  ]);

  accounts.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  categories.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  transactions.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  stockTrades.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  setState({ accounts, categories, transactions, stockTrades, stockPrices });
}