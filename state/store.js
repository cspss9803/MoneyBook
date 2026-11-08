const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const firstDayOfMonthStr = `${todayStr.slice(0, 8)}01`;

export const store = {
  theme: localStorage.getItem('mb_theme') === 'dark' ? 'dark' : 'light',
  currentTab: 'transactions', // 'transactions' | 'accounts' | 'stats' | 'settings'
  accounts: [],
  categories: [],
  transactions: [],

  // 記錄目前開啟的選單與彈窗堆疊 (供手機返回鍵依序關閉)
  overlayStack: [],

  // 設定頁當前檢視的類別分頁
  settingsCategoryType: 'expense', // 'expense' | 'income'

  // 統計頁篩選狀態
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