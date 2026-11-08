import { formatCurrency } from '../domain/formatCurrency.js';

export function drawStatsChart(items, totalAmount) {
  if (!items || items.length === 0 || totalAmount <= 0) {
    return `
      <div class="py-10 text-center text-sm text-slate-400">
        所選區間與篩選條件下無統計資料
      </div>
    `;
  }

  let cumulativePercent = 0;
  const circlesHtml = items
    .map((item) => {
      const pct = (item.amount / totalAmount) * 100;
      const dashArray = `${pct} ${100 - pct}`;
      const dashOffset = 25 - cumulativePercent;
      cumulativePercent += pct;

      return `
        <circle
          cx="21"
          cy="21"
          r="15.9154943"
          fill="transparent"
          stroke="${item.color}"
          stroke-width="5.5"
          stroke-dasharray="${dashArray}"
          stroke-dashoffset="${dashOffset}"
        ></circle>
      `;
    })
    .join('');

  const barsHtml = items
    .slice(0, 6)
    .map((item) => {
      const widthPct = Math.max(2, Math.min(100, item.percentage));
      return `
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <span class="font-medium text-slate-700 truncate">${item.name}</span>
            <span class="text-slate-500">${item.percentage}%</span>
          </div>
          <div class="w-full h-2 bg-slate-100 rounded-sm overflow-hidden">
            <div class="h-full" style="width: ${widthPct}%; background-color: ${item.color}"></div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="grid grid-cols-1 gap-4 items-center">
      <!-- 純色圓餅圖 -->
      <div class="relative w-44 h-44 mx-auto">
        <svg viewBox="0 0 42 42" class="w-full h-full">
          <circle cx="21" cy="21" r="15.9154943" fill="transparent" style="stroke: var(--chart-track)" stroke-width="5.5"></circle>
          ${circlesHtml}
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span class="text-[11px] text-slate-400">總計金額</span>
          <span class="text-sm font-bold text-slate-900 truncate max-w-full">${formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <!-- 長條趨勢佔比 -->
      <div class="space-y-2.5 pt-2 border-t border-slate-100">
        ${barsHtml}
      </div>
    </div>
  `;
}