import { pushOverlay } from './pushOverlay.js';
import { popOverlay } from './popOverlay.js';

export function openDatePicker({
  id = 'date-picker',
  title = '選擇日期',
  selectedDateStr = '', // 格式 YYYY-MM-DD
  onSelect = null
}) {
  const existing = document.getElementById('date-picker-layer');
  if (existing) existing.remove();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const baseDate = selectedDateStr ? new Date(`${selectedDateStr}T00:00:00`) : new Date();
  let currentYear = isNaN(baseDate.getFullYear()) ? now.getFullYear() : baseDate.getFullYear();
  let currentMonth = isNaN(baseDate.getMonth()) ? now.getMonth() : baseDate.getMonth();

  const layer = document.createElement('div');
  layer.id = 'date-picker-layer';
  layer.className = 'fixed inset-0 bg-slate-900/40 z-40 flex items-center justify-center p-4';

  function renderCalendarContent() {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekdaysHtml = weekDays
      .map((d) => `<div class="text-center text-xs font-semibold text-slate-400 py-1">${d}</div>`)
      .join('');

    const daysHtml = [];

    // 補齊上個月尾巴
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      let prevM = currentMonth - 1;
      let prevY = currentYear;
      if (prevM < 0) {
        prevM = 11;
        prevY -= 1;
      }
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      daysHtml.push(`
        <button type="button" data-date="${dateStr}" class="h-9 w-full flex items-center justify-center text-xs text-slate-300 rounded hover:bg-slate-100">${dayNum}</button>
      `);
    }

    // 當月日期
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const isSelected = dateStr === selectedDateStr;
      const isToday = dateStr === todayStr;

      let btnClass = 'text-slate-700 hover:bg-slate-100';
      if (isSelected) {
        btnClass = 'bg-slate-900 text-white font-bold hover:bg-slate-800';
      } else if (isToday) {
        btnClass = 'border border-slate-900 text-slate-900 font-semibold';
      }

      daysHtml.push(`
        <button type="button" data-date="${dateStr}" class="h-9 w-full flex items-center justify-center text-xs rounded ${btnClass}">${dayNum}</button>
      `);
    }

    // 補齊下個月開頭直到 35 或 42 格
    const totalCells = weekdaysHtml.split('</div>').length - 1 + daysHtml.length;
    const remainingCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      let nextM = currentMonth + 1;
      let nextY = currentYear;
      if (nextM > 11) {
        nextM = 0;
        nextY += 1;
      }
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      daysHtml.push(`
        <button type="button" data-date="${dateStr}" class="h-9 w-full flex items-center justify-center text-xs text-slate-300 rounded hover:bg-slate-100">${i}</button>
      `);
    }

    layer.innerHTML = `
      <div class="bg-white w-full max-w-xs rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
          <h3 class="text-sm font-bold text-slate-900">${title}</h3>
          <button id="btn-close-date-picker" type="button" class="text-xs text-slate-500 px-2 py-1">關閉</button>
        </div>

        <!-- 年月切換列 -->
        <div class="flex items-center justify-between mb-3 px-1">
          <button id="btn-prev-month" type="button" class="p-1.5 rounded hover:bg-slate-100 text-slate-600">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="text-xs font-bold text-slate-900">
            ${currentYear} 年 ${currentMonth + 1} 月
          </div>
          <button id="btn-next-month" type="button" class="p-1.5 rounded hover:bg-slate-100 text-slate-600">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- 星期網格 -->
        <div class="grid grid-cols-7 mb-1">
          ${weekdaysHtml}
        </div>

        <!-- 日期網格 -->
        <div class="grid grid-cols-7 gap-y-1 mb-3">
          ${daysHtml.join('')}
        </div>

        <!-- 快速選擇今天 -->
        <div class="pt-2 border-t border-slate-100 flex justify-between items-center">
          <button id="btn-pick-today" type="button" class="text-xs font-semibold text-slate-900 underline">
            選擇今天 (${todayStr})
          </button>
          <span class="text-[11px] text-slate-400">點擊日期直接確認</span>
        </div>
      </div>
    `;

    bindPickerEvents();
  }

  function closePicker() {
    popOverlay(id);
    layer.remove();
  }

  pushOverlay(id, closePicker);

  function bindPickerEvents() {
    layer.addEventListener('click', (e) => {
      if (e.target === layer) closePicker();
    });

    layer.querySelector('#btn-close-date-picker')?.addEventListener('click', closePicker);

    layer.querySelector('#btn-prev-month')?.addEventListener('click', () => {
      currentMonth -= 1;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear -= 1;
      }
      renderCalendarContent();
    });

    layer.querySelector('#btn-next-month')?.addEventListener('click', () => {
      currentMonth += 1;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
      }
      renderCalendarContent();
    });

    layer.querySelector('#btn-pick-today')?.addEventListener('click', () => {
      closePicker();
      if (typeof onSelect === 'function') {
        onSelect(todayStr);
      }
    });

    layer.querySelectorAll('[data-date]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dateStr = btn.dataset.date;
        closePicker();
        if (typeof onSelect === 'function') {
          onSelect(dateStr);
        }
      });
    });
  }

  document.body.appendChild(layer);
  renderCalendarContent();
}