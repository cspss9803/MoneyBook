export function aggregateStatsByCategory(transactions, categories, statsFilter) {
    const { type, selectedCategoryIds, includeExcluded } = statsFilter;
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const grouped = new Map();
    let totalAmount = 0;

    for (const tx of transactions) {
        if (tx.type !== type) continue;
        if (!includeExcluded && tx.excludeFromStats) continue;
        if (Array.isArray(selectedCategoryIds) && !selectedCategoryIds.includes(tx.categoryId)) {
            continue;
        }

        const amount = Math.round(Number(tx.amount) || 0);
        totalAmount += amount;

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
        item.amount += amount;
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