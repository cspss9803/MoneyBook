import { computed } from 'vue';
import { ACCOUNT_TYPES } from '../config/constants.js';
import { useLedgerStore } from '../stores/useLedgerStore.js';
import { calculateAccountBalance } from '../domain/calculateAccountBalance.js';
import { calculateStockPortfolio } from '../domain/calculateStockPortfolio.js';

export function usePortfolioSummary() {
  const ledgerStore = useLedgerStore();

  return computed(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;

    const list = ledgerStore.accounts.map((acc) => {
      if (acc.type === 'stock') {
        const portfolio = calculateStockPortfolio(acc, ledgerStore.stockTrades, ledgerStore.stockPrices);
        totalAssets += portfolio.totalMarketValue;
        return { ...acc, balance: portfolio.totalMarketValue, portfolio };
      }
      const balance = calculateAccountBalance(acc, ledgerStore.transactions);
      if (balance >= 0) totalAssets += balance;
      else totalLiabilities += Math.abs(balance);
      return { ...acc, balance };
    });

    const groups = ACCOUNT_TYPES.map((t) => {
      const items = list.filter((a) => a.type === t.id);
      const groupTotal = items.reduce((sum, a) => sum + a.balance, 0);
      return { ...t, items, groupTotal };
    }).filter((g) => g.items.length > 0);

    return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities, groups };
  });
}
