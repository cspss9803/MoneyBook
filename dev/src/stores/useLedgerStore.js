import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import { STORES } from '../config/constants.js';
import { getAllRecords } from '../db/getAllRecords.js';
import { syncDailyStockPrices } from '../domain/syncDailyStockPrices.js';

export const useLedgerStore = defineStore('ledger', () => {
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const firstDayOfMonthStr = `${todayStr.slice(0, 8)}01`;

  const currentTab = ref('transactions');
  const settingsCategoryType = ref('expense');

  const accounts = ref([]);
  const categories = ref([]);
  const transactions = ref([]);
  const stockTrades = ref([]);
  const stockPrices = ref([]);

  const statsFilter = reactive({
    type: 'expense',
    period: 'month',
    anchorDate: todayStr,
    customStart: firstDayOfMonthStr,
    customEnd: todayStr,
    selectedCategoryIds: null,
    includeExcluded: false
  });

  const accountMap = computed(() => new Map(accounts.value.map((a) => [a.id, a])));
  const categoryMap = computed(() => new Map(categories.value.map((c) => [c.id, c])));

  async function refreshData() {
    const [accList, catList, txList, tradeList, priceList] = await Promise.all([
      getAllRecords(STORES.ACCOUNTS),
      getAllRecords(STORES.CATEGORIES),
      getAllRecords(STORES.TRANSACTIONS),
      getAllRecords(STORES.STOCK_TRADES),
      getAllRecords(STORES.STOCK_PRICES)
    ]);

    accList.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    catList.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    txList.sort((a, b) => (b.date !== a.date ? b.date.localeCompare(a.date) : (b.createdAt || 0) - (a.createdAt || 0)));
    tradeList.sort((a, b) => (b.date !== a.date ? b.date.localeCompare(a.date) : (b.createdAt || 0) - (a.createdAt || 0)));

    accounts.value = accList;
    categories.value = catList;
    transactions.value = txList;
    stockTrades.value = tradeList;
    stockPrices.value = priceList;
  }

  async function syncPrices(forceOption = null) {
    const updated = await syncDailyStockPrices({
      stockTrades: stockTrades.value,
      stockPrices: stockPrices.value,
      forceOption
    });
    if (updated) await refreshData();
  }

  return {
    currentTab, settingsCategoryType, accounts, categories, transactions,
    stockTrades, stockPrices, statsFilter, accountMap, categoryMap,
    refreshData, syncPrices
  };
});
