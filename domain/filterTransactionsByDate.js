export function filterTransactionsByDate(transactions, statsFilter) {
  const { period, anchorDate, customStart, customEnd } = statsFilter;

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = fmt(new Date());
  const base = new Date(`${anchorDate || todayStr}T00:00:00`);
  const year = base.getFullYear();
  const month = base.getMonth();

  let startDate = new Date(base);
  let endDate = new Date(base);

  if (period === 'week') {
    const day = base.getDay() || 7;
    startDate.setDate(base.getDate() - day + 1);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
  } else if (period === 'month') {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0);
  } else if (period === 'quarter') {
    const startMonth = Math.floor(month / 3) * 3;
    startDate = new Date(year, startMonth, 1);
    endDate = new Date(year, startMonth + 3, 0);
  } else if (period === 'halfYear') {
    const startMonth = month < 6 ? 0 : 6;
    startDate = new Date(year, startMonth, 1);
    endDate = new Date(year, startMonth + 6, 0);
  } else if (period === 'year') {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
  } else if (period === 'custom') {
    const startStr = customStart || '1970-01-01';
    const rawEndStr = customEnd || '2099-12-31';
    const effectiveEndStr = rawEndStr > todayStr ? todayStr : rawEndStr;
    return transactions.filter((tx) => tx.date >= startStr && tx.date <= effectiveEndStr);
  }

  const startStr = fmt(startDate);
  const rawEndStr = fmt(endDate);
  const effectiveEndStr = rawEndStr > todayStr ? todayStr : rawEndStr;

  return transactions.filter((tx) => tx.date >= startStr && tx.date <= effectiveEndStr);
}