export const SYSTEM_REPAYMENT_CATEGORY = {
  id: 'cat_sys_repayment',
  type: 'income',
  name: '還款',
  color: '#0d9488',
  iconType: 'preset',
  iconData: 'handCoins',
  isSystem: true,
  createdAt: 12
};

export const SYSTEM_STOCK_BUY_CATEGORY = {
  id: 'cat_sys_stock_buy',
  type: 'expense',
  name: '股票交割',
  color: '#db2777',
  iconType: 'preset',
  iconData: 'trendingUp',
  isSystem: true,
  createdAt: 13
};

export const SYSTEM_STOCK_SELL_CATEGORY = {
  id: 'cat_sys_stock_sell',
  type: 'income',
  name: '股票交割',
  color: '#16a34a',
  iconType: 'preset',
  iconData: 'trendingUp',
  isSystem: true,
  createdAt: 14
};

export const SYSTEM_STOCK_FEE_CATEGORY = {
  id: 'cat_sys_stock_fee',
  type: 'expense',
  name: '手續費',
  color: '#0284c7',
  iconType: 'preset',
  iconData: 'handCoins',
  isSystem: true,
  createdAt: 15
};

export const SYSTEM_STOCK_TAX_CATEGORY = {
  id: 'cat_sys_stock_tax',
  type: 'expense',
  name: '證交稅',
  color: '#d97706',
  iconType: 'preset',
  iconData: 'handCoins',
  isSystem: true,
  createdAt: 16
};

export const SYSTEM_OVERFLOW_CATEGORY = {
  id: 'cat_sys_overflow',
  type: 'income',
  name: '溢出還款',
  color: '#059669',
  iconType: 'preset',
  iconData: 'trendingUp',
  isSystem: true
};

export const SYSTEM_CATEGORIES = [
  SYSTEM_REPAYMENT_CATEGORY,
  SYSTEM_STOCK_BUY_CATEGORY,
  SYSTEM_STOCK_SELL_CATEGORY,
  SYSTEM_STOCK_FEE_CATEGORY,
  SYSTEM_STOCK_TAX_CATEGORY
];

export const DEFAULT_CATEGORIES = [
  // 預設支出類別
  { id: 'cat_exp_food', type: 'expense', name: '餐飲', color: '#ea580c', iconType: 'preset', iconData: 'utensils', createdAt: 1 },
  { id: 'cat_exp_trans', type: 'expense', name: '交通', color: '#0284c7', iconType: 'preset', iconData: 'bus', createdAt: 2 },
  { id: 'cat_exp_shop', type: 'expense', name: '購物', color: '#db2777', iconType: 'preset', iconData: 'shoppingBag', createdAt: 3 },
  { id: 'cat_exp_home', type: 'expense', name: '居住', color: '#4f46e5', iconType: 'preset', iconData: 'home', createdAt: 4 },
  { id: 'cat_exp_fun', type: 'expense', name: '娛樂', color: '#9333ea', iconType: 'preset', iconData: 'film', createdAt: 5 },
  { id: 'cat_exp_med', type: 'expense', name: '醫療', color: '#dc2626', iconType: 'preset', iconData: 'heartPulse', createdAt: 6 },
  { id: 'cat_exp_other', type: 'expense', name: '其他支出', color: '#57534e', iconType: 'preset', iconData: 'tag', createdAt: 7 },

  // 預設收入類別
  { id: 'cat_inc_salary', type: 'income', name: '薪資', color: '#16a34a', iconType: 'preset', iconData: 'briefcase', createdAt: 8 },
  { id: 'cat_inc_bonus', type: 'income', name: '獎金', color: '#0d9488', iconType: 'preset', iconData: 'gift', createdAt: 9 },
  { id: 'cat_inc_invest', type: 'income', name: '投資收益', color: '#2563eb', iconType: 'preset', iconData: 'trendingUp', createdAt: 10 },
  { id: 'cat_inc_other', type: 'income', name: '其他收入', color: '#334155', iconType: 'preset', iconData: 'handCoins', createdAt: 11 },

  // 系統內建專用類別
  ...SYSTEM_CATEGORIES
];
