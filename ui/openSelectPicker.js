import { renderIcon } from './renderIcon.js';
import { pushOverlay } from './pushOverlay.js';
import { popOverlay } from './popOverlay.js';

export function openSelectPicker({
  id = 'select-picker',
  title = '請選擇',
  options = [],
  selectedValue = '',
  onSelect = null
}) {
  const existing = document.getElementById('select-picker-layer');
  if (existing) existing.remove();

  const layer = document.createElement('div');
  layer.id = 'select-picker-layer';
  layer.className = 'fixed inset-0 bg-slate-900/40 z-40 flex items-end justify-center';

  const itemsHtml =
    options.length === 0
      ? '<div class="py-6 text-center text-xs text-slate-400">無可用選項</div>'
      : options
          .map((opt) => {
            const isSelected = String(opt.value) === String(selectedValue);
            const iconHtml = opt.icon
              ? `
                <span class="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  ${renderIcon('preset', opt.icon, 'w-4 h-4')}
                </span>
              `
              : '';

            const subLabelHtml = opt.subLabel
              ? `<span class="text-xs text-slate-400 ml-1.5">${opt.subLabel}</span>`
              : '';

            const checkHtml = isSelected
              ? `
                <span class="text-slate-900 shrink-0 ml-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              `
              : '';

            return `
              <button
                type="button"
                data-select-val="${opt.value}"
                class="w-full p-3 rounded-md border flex items-center justify-between text-left transition-colors ${
                  isSelected
                    ? 'bg-slate-50 border-slate-900 font-semibold text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                }"
              >
                <div class="flex items-center space-x-3 min-w-0">
                  ${iconHtml}
                  <div class="truncate text-sm">
                    <span>${opt.label}</span>
                    ${subLabelHtml}
                  </div>
                </div>
                ${checkHtml}
              </button>
            `;
          })
          .join('');

  layer.innerHTML = `
    <div class="bg-white w-full max-w-md rounded-t-xl border-t border-slate-200 p-4 max-h-[75vh] flex flex-col">
      <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 shrink-0">
        <h3 class="text-sm font-bold text-slate-900">${title}</h3>
        <button id="btn-close-select-picker" type="button" class="text-xs text-slate-500 px-2 py-1">關閉</button>
      </div>
      <div class="space-y-2 overflow-y-auto pr-0.5">
        ${itemsHtml}
      </div>
    </div>
  `;

  document.body.appendChild(layer);

  function closePicker() {
    popOverlay(id);
    layer.remove();
  }

  pushOverlay(id, closePicker);

  layer.addEventListener('click', (e) => {
    if (e.target === layer) closePicker();
  });

  layer.querySelector('#btn-close-select-picker')?.addEventListener('click', closePicker);

  layer.querySelectorAll('[data-select-val]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.selectVal;
      closePicker();
      if (typeof onSelect === 'function') {
        onSelect(val);
      }
    });
  });
}