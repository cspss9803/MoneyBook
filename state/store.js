const todayStr = new Date().toISOString().slice(0, 10);
const firstDayOfMonthStr = `${todayStr.slice(0, 8)}01`;

export const store = {
    currentTab: 'transactions', // 'transactions' | 'accounts' | 'stats' | 'settings'
    accounts: [],
    categories: [],
    transactions: [],

    // 設定頁當前檢視的類別分頁
    settingsCategoryType: 'expense', // 'expense' | 'income'

    // 統計頁篩選狀態
    statsFilter: {
        type: 'expense',          // 'expense' | 'income'
        period: 'month',          // 'week' | 'month' | 'quarter' | 'halfYear' | 'year' | 'custom'
        anchorDate: todayStr,     // 基準日期 (YYYY-MM-DD)
        customStart: firstDayOfMonthStr,
        customEnd: todayStr,
        selectedCategoryIds: null, // null 代表全選；陣列代表僅統計勾選的 categoryId
        includeExcluded: false     // 是否將標記「排除統計」的單筆紀錄納入計算
    }
};