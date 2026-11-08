import { store } from '../state/store.js';
import { setState } from '../state/setState.js';
import { refreshData } from '../state/refreshData.js';
import { exportDatabase } from '../db/exportDatabase.js';
import { importDatabase } from '../db/importDatabase.js';
import { renderIcon } from './renderIcon.js';
import { renderCategoryModal } from './renderCategoryModal.js';
import { openConfirmModal } from './openConfirmModal.js';
import { applyTheme } from './applyTheme.js';

export function renderSettingsView(container) {
  const currentType = store.settingsCategoryType || 'expense';
  const currentTheme = store.theme || 'light';
  const filteredCategories = store.categories.filter((c) => c.type === currentType);

  const categoryRowsHtml = filteredCategories
    .map((cat) => {
      const isSys = Boolean(cat.isSystem || cat.id === 'cat_sys_repayment');

      if (isSys) {
        return `
          <div class="p-3 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded flex items-center justify-center text-white" style="background-color: ${cat.color}">
                ${renderIcon(cat.iconType, cat.iconData, 'w-4 h-4')}
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-slate-900">${cat.name}</span>
                <span class="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded">系統專用</span>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div data-cat-id="${cat.id}" class="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded flex items-center justify-center text-white" style="background-color: ${cat.color}">
              ${renderIcon(cat.iconType, cat.iconData, 'w-4 h-4')}
            </div>
            <span class="text-sm font-medium text-slate-900">${cat.name}</span>
          </div>
          <span class="text-slate-400 p-1">
            ${renderIcon('preset', 'pencil', 'w-4 h-4')}
          </span>
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <header class="mb-4">
      <h1 class="text-lg font-bold text-slate-900">設定與管理</h1>
    </header>

    <!-- 外觀主題切換區塊 -->
    <section class="bg-white border border-slate-200 rounded-md p-3 mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-sm font-bold text-slate-900">外觀主題</h2>
        <p class="text-xs text-slate-500">切換淺色或深色護眼介面</p>
      </div>
      <div class="inline-flex bg-slate-200 p-0.5 rounded-md">
        <button type="button" data-theme-btn="light" class="px-3 py-1 text-xs font-semibold rounded ${
          currentTheme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
        }">淺色</button>
        <button type="button" data-theme-btn="dark" class="px-3 py-1 text-xs font-semibold rounded ${
          currentTheme === 'dark' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
        }">深色</button>
      </div>
    </section>

    <!-- 類別管理區塊 -->
    <section class="bg-white border border-slate-200 rounded-md overflow-hidden mb-4">
      <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div class="inline-flex bg-slate-200 p-0.5 rounded-md">
          <button type="button" data-cat-tab="expense" class="px-3 py-1 text-xs font-semibold rounded ${
            currentType === 'expense' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }">支出類別</button>
          <button type="button" data-cat-tab="income" class="px-3 py-1 text-xs font-semibold rounded ${
            currentType === 'income' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }">收入類別</button>
        </div>
        <button id="btn-add-category" type="button" class="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md active:bg-slate-700">
          ＋ 新增類別
        </button>
      </div>
      <div class="divide-y divide-slate-100">
        ${categoryRowsHtml || '<div class="p-6 text-center text-xs text-slate-400">尚無類別</div>'}
      </div>
    </section>

    <!-- 資料匯出入備份區塊 -->
    <section class="bg-white border border-slate-200 rounded-md p-4 space-y-3">
      <div>
        <h2 class="text-sm font-bold text-slate-900">資料備份與還原</h2>
        <p class="text-xs text-slate-500 mt-0.5">所有資料儲存於瀏覽器 IndexedDB，可匯出為 JSON 檔案保存或還原。</p>
      </div>

      <div class="grid grid-cols-2 gap-3 pt-1">
        <button id="btn-export-db" type="button" class="py-2.5 px-3 border border-slate-300 rounded-md text-xs font-semibold text-slate-800 bg-white active:bg-slate-100">
          匯出備份 (JSON)
        </button>
        <label class="py-2.5 px-3 bg-slate-900 text-white rounded-md text-xs font-semibold text-center cursor-pointer active:bg-slate-700">
          匯入還原 (JSON)
          <input id="input-import-db" type="file" accept="application/json,.json" class="hidden" />
        </label>
      </div>
      <div id="backup-msg" class="text-xs text-slate-600 hidden"></div>
    </section>
  `;

  container.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.themeBtn);
      setState({ theme: btn.dataset.themeBtn });
    });
  });

  container.querySelectorAll('[data-cat-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setState({ settingsCategoryType: btn.dataset.catTab });
    });
  });

  container.querySelector('#btn-add-category')?.addEventListener('click', () => {
    renderCategoryModal(null, currentType);
  });

  container.querySelectorAll('[data-cat-id]').forEach((row) => {
    row.addEventListener('click', () => {
      const target = store.categories.find((c) => c.id === row.dataset.catId);
      if (target && !target.isSystem && target.id !== 'cat_sys_repayment') {
        renderCategoryModal(target, currentType);
      }
    });
  });

  container.querySelector('#btn-export-db')?.addEventListener('click', () => {
    openConfirmModal({
      id: 'export-backup-confirm',
      title: '匯出備份檔案',
      message: '確定要將目前的記帳資料匯出並下載為 JSON 備份檔嗎？',
      confirmText: '確定匯出',
      cancelText: '取消',
      onConfirm: async () => {
        await exportDatabase();
      }
    });
  });

  container.querySelector('#input-import-db')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const msgEl = container.querySelector('#backup-msg');
    try {
      const text = await file.text();
      await importDatabase(text);
      await refreshData();
      if (msgEl) {
        msgEl.textContent = '資料匯入成功！';
        msgEl.className = 'text-xs text-emerald-600 block';
      }
    } catch (err) {
      if (msgEl) {
        msgEl.textContent = `匯入失敗：${err.message}`;
        msgEl.className = 'text-xs text-rose-600 block';
      }
    }
  });
}