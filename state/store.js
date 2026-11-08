const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const firstDayOfMonthStr = `${todayStr.slice(0, 8)}01`;

export const store = {
  theme: localStorage.getItem('mb_theme') === 'dark' ? 'dark' : 'light',
  currentTab: 'transactions',
  accounts: [],
  categories: [],
  transactions: [],
  stockTrades: [],
  stockPrices: [],

  overlayStack: [],
  settingsCategoryType: 'expense',

  statsFilter: {
    type: 'expense',
    period: 'month',
    anchorDate: todayStr,
    customStart: firstDayOfMonthStr,
    customEnd: todayStr,
    selectedCategoryIds: null,
    includeExcluded: false
  }
};