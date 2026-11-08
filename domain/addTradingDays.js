export function addTradingDays(dateStr, tradingDaysToAdd = 2) {
  const date = new Date(`${dateStr}T00:00:00`);
  let added = 0;

  while (added < tradingDaysToAdd) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    // 0 為週日，6 為週六
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added += 1;
    }
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}