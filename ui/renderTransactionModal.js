import { STORES, TRANSACTION_TYPES, ACCOUNT_TYPES } from '../config/constants.js';
import { store } from '../state/store.js';
import { refreshData } from '../state/refreshData.js';
import { addRecord } from '../db/addRecord.js';
import { updateRecord } from '../db/updateRecord.js';
import { deleteRecord } from '../db/deleteRecord.js';
import { parseIntegerAmount } from '../domain/parseIntegerAmount.js';
import { renderIcon } from './renderIcon.js';
import { pushOverlay } from './pushOverlay.js';
import { popOverlay } from './popOverlay.js';
import { openSelectPicker } from './openSelectPicker.js';
import { openDatePicker } from './openDatePicker.js';

export function renderTransactionModal(editingTx = null) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const isEdit = Boolean(editingTx);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const accountTypeMap = new Map(ACCOUNT_TYPES.map((t) => [t.id, t.label]));

  const formState = {
    type: editingTx?.type || 'expense',
    amount: editingTx?.amount || '',
    name: editingTx?.name || '',
    date: editingTx?.date || todayStr,
    accountId: editingTx?.accountId || '',
    toAccountId: editingTx?.toAccountId || '',
    categoryId: editingTx?.categoryId || '',
    note: editingTx?.note || '',
    excludeFromStats: Boolean(editingTx?.excludeFromStats)
  };

  function closeModal() {
    popOverlay('tx-modal');
    modalRoot.innerHTML = '';
  }

  pushOverlay('tx-modal', closeModal);

  function getAllowedFromAccounts() {
    if (formState.type === 'income' || formState.type === 'transfer') {
      return store.accounts.filter((a) => a.type !== 'credit');
    }
    return store.accounts;
  }

  function ensureValidSelections() {
    const allowedFrom = getAllowedFromAccounts();
    if (!allowedFrom.some((a) => a.id === formState.accountId)) {
      formState.accountId = allowedFrom[0]?.id || '';
    }

    if (formState.type === 'transfer') {
      formState.categoryId = null;
      if (!store.accounts.some((a) => a.id === formState.toAccountId) || formState.toAccountId === formState.accountId) {
        const anotherAcc = store.accounts.find((a) => a.id !== formState.accountId);
        formState.toAccountId = anotherAcc?.id || store.accounts[0]?.id || '';
      }
      return;
    }

    const matchingCats = store.categories.filter((c) => c.type === formState.type);
    if (!matchingCats.some((c) => c.id === formState.categoryId)) {
      formState.categoryId = matchingCats[0]?.id || '';
    }
  }

  ensureValidSelections();

  function renderAccountSelectorButton(btnId, accountObj, placeholder = '請選擇帳戶') {
    if (!accountObj) {
      return `
        <button id="${btnId}" type="button" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-400 flex items-center justify-between">
          <span class="truncate">${placeholder}</span>
          <svg class="w-4 h-4 text-slate-400 shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      `;
    }

    return `
      <button id="${btnId}" type="button" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 flex items-center justify-between active:bg-slate-50">
        <span class="flex items-center space-x-2 min-w-0">
          <span class="w-4 h-4 text-slate-600 shrink-0 flex items-center justify-center">
            ${renderIcon('preset', accountObj.iconData, 'w-4 h-4')}
          </span>
          <span class="truncate font-medium">${accountObj.name}</span>
        </span>
        <svg class="w-4 h-4 text-slate-400 shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    `;
  }

  function renderModalContent() {
    const isTransfer = formState.type === 'transfer';
    const availableCategories = store.categories.filter((c) => c.type === formState.type);
    const fromAccountObj = store.accounts.find((a) => a.id === formState.accountId);
    const toAccountObj = store.accounts.find((a) => a.id === formState.toAccountId);

    modalRoot.innerHTML = `
      <div id="tx-modal-backdrop" class="fixed inset-0 bg-slate-900/40 z-30 flex items-end justify-center">
        <div class="bg-white w-full max-w-md rounded-t-xl border-t border-slate-200 p-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <h2 class="text-base font-bold text-slate-900">${isEdit ? '編輯紀錄' : '新增紀錄'}</h2>
            <button id="btn-close-tx-modal" type="button" class="text-sm text-slate-500 px-2 py-1">關閉</button>
          </div>

          <!-- 支出 / 收入 / 轉移 切換器 -->
          <div class="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-md mb-4 border border-slate-200">
            ${TRANSACTION_TYPES.map((t) => {
              const active = formState.type === t.id;
              return `
                <button type="button" data-tx-type="${t.id}" class="py-1.5 text-xs font-semibold rounded ${
                  active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }">${t.label}</button>
              `;
            }).join('')}
          </div>

          <form id="tx-form" class="space-y-3">
            <!-- 金額與自訂日期按鈕 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">金額 (整數元)</label>
                <input id="tx-amount" type="number" step="1" min="1" required placeholder="0" value="${formState.amount}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold focus:outline-none focus:border-slate-900" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">日期</label>
                <button id="btn-pick-date" type="button" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium flex items-center justify-between active:bg-slate-50">
                  <span class="truncate">${formState.date}</span>
                  <svg class="w-4 h-4 text-slate-400 shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </button>
              </div>
            </div>

            <!-- 項目名稱 -->
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">項目名稱</label>
              <input id="tx-name" type="text" placeholder="${isTransfer ? '例如：繳信用卡費、ATM 提款' : '選填，未填則顯示類別名稱'}" value="${formState.name}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900" />
            </div>

            <!-- 自訂帳戶選擇器 -->
            ${
              isTransfer
                ? `
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">轉出帳戶 (不含信用卡)</label>
                  ${renderAccountSelectorButton('btn-pick-from-acc', fromAccountObj)}
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">轉入帳戶 (可還信用卡)</label>
                  ${renderAccountSelectorButton('btn-pick-to-acc', toAccountObj)}
                </div>
              </div>
            `
                : `
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">所屬帳戶${formState.type === 'income' ? ' (信用卡不可存入收入)' : ''}</label>
                ${renderAccountSelectorButton('btn-pick-from-acc', fromAccountObj)}
              </div>
            `
            }

            <!-- 類別網格 -->
            ${
              !isTransfer
                ? `
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">選擇類別</label>
                <div class="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 rounded-md bg-slate-50">
                  ${availableCategories
                    .map((cat) => {
                      const selected = cat.id === formState.categoryId;
                      return `
                        <button type="button" data-cat-id="${cat.id}" class="p-2 rounded border flex flex-col items-center justify-center space-y-1 ${
                          selected ? 'bg-white border-slate-900 font-semibold' : 'border-transparent text-slate-600'
                        }">
                          <span class="w-7 h-7 rounded flex items-center justify-center text-white" style="background-color: ${cat.color}">
                            ${renderIcon(cat.iconType, cat.iconData, 'w-4 h-4')}
                          </span>
                          <span class="text-[11px] truncate w-full text-center">${cat.name}</span>
                        </button>
                      `;
                    })
                    .join('')}
                </div>
              </div>
            `
                : ''
            }

            <!-- 備註 -->
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">備註</label>
              <input id="tx-note" type="text" placeholder="選填備註..." value="${formState.note}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900" />
            </div>

            <!-- 排除統計開關 -->
            ${
              !isTransfer
                ? `
              <label class="flex items-center space-x-2 pt-1 cursor-pointer">
                <input id="tx-exclude" type="checkbox" ${formState.excludeFromStats ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0" />
                <span class="text-xs text-slate-700">此筆紀錄排除於統計圖表之外</span>
              </label>
            `
                : ''
            }

            <div id="tx-error" class="text-xs text-rose-600 hidden"></div>

            <!-- 底部操作按鈕 -->
            <div class="pt-3 flex items-center space-x-2">
              ${
                isEdit
                  ? `<button id="btn-delete-tx" type="button" class="px-4 py-2.5 border border-rose-200 text-rose-600 text-sm font-semibold rounded-md">刪除</button>`
                  : ''
              }
              <button type="submit" class="flex-1 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-md active:bg-slate-700">
                儲存紀錄
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    bindModalEvents();
  }

  function syncInputsToState() {
    const amountEl = modalRoot.querySelector('#tx-amount');
    const nameEl = modalRoot.querySelector('#tx-name');
    const noteEl = modalRoot.querySelector('#tx-note');
    const excludeEl = modalRoot.querySelector('#tx-exclude');

    if (amountEl) formState.amount = amountEl.value;
    if (nameEl) formState.name = nameEl.value.trim();
    if (noteEl) formState.note = noteEl.value.trim();
    if (excludeEl) formState.excludeFromStats = excludeEl.checked;
  }

  function bindModalEvents() {
    const backdrop = modalRoot.querySelector('#tx-modal-backdrop');
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    modalRoot.querySelector('#btn-close-tx-modal')?.addEventListener('click', closeModal);

    modalRoot.querySelector('#btn-pick-date')?.addEventListener('click', () => {
      syncInputsToState();
      openDatePicker({
        id: 'pick-tx-date',
        title: '選擇記帳日期',
        selectedDateStr: formState.date,
        onSelect: (dateStr) => {
          formState.date = dateStr;
          renderModalContent();
        }
      });
    });

    modalRoot.querySelectorAll('[data-tx-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncInputsToState();
        formState.type = btn.dataset.txType;
        ensureValidSelections();
        renderModalContent();
      });
    });

    modalRoot.querySelector('#btn-pick-from-acc')?.addEventListener('click', () => {
      syncInputsToState();
      const allowedFrom = getAllowedFromAccounts();
      openSelectPicker({
        id: 'pick-from-acc',
        title: formState.type === 'transfer' ? '選擇轉出帳戶' : '選擇所屬帳戶',
        selectedValue: formState.accountId,
        options: allowedFrom.map((acc) => ({
          value: acc.id,
          label: acc.name,
          subLabel: `(${accountTypeMap.get(acc.type) || ''})`,
          icon: acc.iconData
        })),
        onSelect: (val) => {
          formState.accountId = val;
          renderModalContent();
        }
      });
    });

    modalRoot.querySelector('#btn-pick-to-acc')?.addEventListener('click', () => {
      syncInputsToState();
      openSelectPicker({
        id: 'pick-to-acc',
        title: '選擇轉入帳戶',
        selectedValue: formState.toAccountId,
        options: store.accounts.map((acc) => ({
          value: acc.id,
          label: acc.name,
          subLabel: `(${accountTypeMap.get(acc.type) || ''})`,
          icon: acc.iconData
        })),
        onSelect: (val) => {
          formState.toAccountId = val;
          renderModalContent();
        }
      });
    });

    modalRoot.querySelectorAll('[data-cat-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncInputsToState();
        formState.categoryId = btn.dataset.catId;
        renderModalContent();
      });
    });

    modalRoot.querySelector('#btn-delete-tx')?.addEventListener('click', async () => {
      if (!editingTx) return;
      await deleteRecord(STORES.TRANSACTIONS, editingTx.id);
      closeModal();
      await refreshData();
    });

    modalRoot.querySelector('#tx-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      syncInputsToState();

      const errorEl = modalRoot.querySelector('#tx-error');
      if (!formState.accountId) {
        errorEl.textContent = '請先建立至少一個非信用卡的現金或虛擬帳戶';
        errorEl.classList.remove('hidden');
        return;
      }

      if (formState.type === 'transfer' && formState.accountId === formState.toAccountId) {
        errorEl.textContent = '轉出帳戶與轉入帳戶不能相同';
        errorEl.classList.remove('hidden');
        return;
      }

      const record = {
        id: editingTx?.id || `tx_${Date.now()}`,
        type: formState.type,
        amount: parseIntegerAmount(formState.amount, false),
        name: formState.name,
        date: formState.date,
        accountId: formState.accountId,
        toAccountId: formState.type === 'transfer' ? formState.toAccountId : null,
        categoryId: formState.type === 'transfer' ? null : formState.categoryId,
        note: formState.note,
        excludeFromStats: formState.type === 'transfer' ? true : Boolean(formState.excludeFromStats),
        createdAt: editingTx?.createdAt || Date.now()
      };

      if (isEdit) {
        await updateRecord(STORES.TRANSACTIONS, record);
      } else {
        await addRecord(STORES.TRANSACTIONS, record);
      }

      closeModal();
      await refreshData();
    });
  }

  renderModalContent();
}