export const DB_NAME = 'MinimalLedgerDB';
export const DB_VERSION = 1;

export const STORES = {
    ACCOUNTS: 'accounts',
    CATEGORIES: 'categories',
    TRANSACTIONS: 'transactions'
};

export const ACCOUNT_TYPES = [
    { id: 'cash', label: '現金' },
    { id: 'credit', label: '信用卡' },
    { id: 'virtual', label: '虛擬帳戶' },
    { id: 'investment', label: '投資' },
    { id: 'receivable', label: '應收帳' },
    { id: 'payable', label: '應負帳' }
];

export const TRANSACTION_TYPES = [
    { id: 'expense', label: '支出' },
    { id: 'income', label: '收入' },
    { id: 'transfer', label: '轉移' }
];

export const STATS_PERIODS = [
    { id: 'week', label: '週' },
    { id: 'month', label: '月' },
    { id: 'quarter', label: '季' },
    { id: 'halfYear', label: '半年' },
    { id: 'year', label: '整年' },
    { id: 'custom', label: '自訂區間' }
];