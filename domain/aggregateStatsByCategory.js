import { SYSTEM_OVERFLOW_CATEGORY } from '../config/defaultCategories.js';

export function aggregateStatsByCategory(transactions, categories, statsFilter, receivablesInfo = null) {
  const { type, selectedCategoryIds, includeExcluded } = statsFilter;
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const grouped = new Map();
  let totalAmount = 0;

  const advanceMap = receivablesInfo?.advanceMap || new Map();
  const repaymentOverflowMap = receivablesInfo?.repaymentOverflowMap || new Map();

  for (const tx of transactions) {
    if (tx.type !== type) continue;
    if (!includeExcluded && tx.excludeFromStats) continue;

    // 處理「還款 (cat_sys_repayment)」：預設不計入一般收入，僅將超額部分歸入隱藏的「溢出還款」
    if (type === 'income' && tx.categoryId === 'cat_sys_repayment') {
      const overflowAmt = repaymentOverflowMap.get(tx.id) || 0;
      if (overflowAmt <= 0) continue;

      const overflowCat = SYSTEM_OVERFLOW_CATEGORY;
      totalAmount += overflowAmt;

      if (!grouped.has(overflowCat.id)) {
        grouped.set(overflowCat.id, {
          categoryId: overflowCat.id,
          name: overflowCat.name,
          color: overflowCat.color,
          iconType: overflowCat.iconType,
          iconData: overflowCat.iconData,
          amount: 0,
          count: 0
        });
      }
      const item = grouped.get(overflowCat.id);
      item.amount += overflowAmt;
      item.count += 1;
      continue;
    }

    if (Array.isArray(selectedCategoryIds) && !selectedCategoryIds.includes(tx.categoryId)) {
      continue;
    }

    // 計算有效統計金額：
    // 1. 支出若有代墊且已被還款，使用折抵後的 effectiveExpense
    // 2. 收入若有劃分自留與他人金額，僅統計屬於自己的 myAmount
    let effectiveAmount = Math.round(Number(tx.amount) || 0);

    if (type === 'expense' && advanceMap.has(tx.id)) {
      effectiveAmount = advanceMap.get(tx.id).effectiveExpense;
    } else if (type === 'income' && (tx.otherAmount || 0) >= 1) {
      effectiveAmount = Math.max(0, Math.round(Number(tx.myAmount) ?? effectiveAmount));
    }

    if (effectiveAmount <= 0) continue;

    totalAmount += effectiveAmount;

    const cat = categoryMap.get(tx.categoryId) || {
      id: 'unknown',
      name: '未分類',
      color: '#64748b',
      iconType: 'preset',
      iconData: 'tag'
    };

    if (!grouped.has(cat.id)) {
      grouped.set(cat.id, {
        categoryId: cat.id,
        name: cat.name,
        color: cat.color,
        iconType: cat.iconType,
        iconData: cat.iconData,
        amount: 0,
        count: 0
      });
    }

    const item = grouped.get(cat.id);
    item.amount += effectiveAmount;
    item.count += 1;
  }

  const items = Array.from(grouped.values())
    .sort((a, b) => b.amount - a.amount)
    .map((item) => ({
      ...item,
      percentage: totalAmount > 0 ? Math.round((item.amount / totalAmount) * 1000) / 10 : 0
    }));

  return { totalAmount, items };
}