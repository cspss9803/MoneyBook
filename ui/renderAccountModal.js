import { STORES, ACCOUNT_TYPES } from '../config/constants.js';
import { PRESET_ICONS } from '../config/presetIcons.js';
import { refreshData } from '../state/refreshData.js';
import { addRecord } from '../db/addRecord.js';
import { updateRecord } from '../db/updateRecord.js';
import { deleteRecord } from '../db/deleteRecord.js';
import { parseIntegerAmount } from '../domain/parseIntegerAmount.js';
import { renderIcon } from './renderIcon.js';
import { pushOverlay } from './pushOverlay.js';
import { popOverlay } from './popOverlay.js';
import { openSelectPicker } from './openSelectPicker.js';
import { openConfirmModal } from './openConfirmModal.js';

export function renderAccountModal(editingAccount = null) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const isEdit = Boolean(editingAccount);
  const formState = {
    name: editingAccount?.name || '',
    type: editingAccount?.type || ACCOUNT_TYPES[0].id,
    initialBalance: editingAccount?.type === 'credit' ? 0 : (editingAccount?.initialBalance ?? 0),
    iconType: 'preset',
    iconData: editingAccount?.iconData && PRESET_ICONS[editingAccount.iconData] ? editingAccount.iconData : 'wallet'
  };

  function closeModal() {
    modalRoot.innerHTML = '';
    popOverlay('acc-modal');
  }

  pushOverlay('acc-modal', closeModal);

  function renderModalContent() {
    const isCredit = formState.type === 'credit';
    const currentTypeLabel = ACCOUNT_TYPES.find((t) => t.id === formState.type)?.label || '現金';

    modalRoot.innerHTML = `
      <div id="acc-modal-backdrop" class="fixed inset-0 bg-slate-900/40 z-30 flex items-end justify-center">
        <div class="bg-white w-full max-w-md rounded-t-xl border-t border-slate-200 p-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <h2 class="text-base font-bold text-slate-900">${isEdit ? '編輯帳戶' : '新增帳戶'}</h2>
            <button id="btn-close-acc-modal" type="button" aria-label="關閉" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-md active:bg-slate-100">
              ${renderIcon('preset', 'x', 'w-5 h-5')}
            </button>
          </div>

          <form id="acc-form" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">帳戶名稱</label>
              <input id="acc-name" type="text" required placeholder="例如：台新銀行、玉山信用卡" value="${formState.name}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900" />
            </div>

            <div class="grid ${isCredit ? 'grid-cols-1' : 'grid-cols-2'} gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">帳戶類型</label>
                <button id="btn-pick-acc-type" type="button" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium flex items-center justify-between active:bg-slate-50">
                  <span>${currentTypeLabel}</span>
                  <svg class="w-4 h-4 text-slate-400 shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>
              ${
                !isCredit
                  ? `
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">初始資金 (整數元)</label>
                  <input id="acc-balance" type="number" step="1" required value="${formState.initialBalance}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold focus:outline-none focus:border-slate-900" />
                </div>
              `
                  : ''
              }
            </div>

            ${
              isCredit
                ? '<div class="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-2.5">信用卡無初始金額，僅能紀錄「支出」消費，並由其他帳戶透過「轉移」轉入此卡進行還款。</div>'
                : ''
            }

            <!-- 圖案選擇 -->
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">帳戶圖案</label>
              <div class="grid grid-cols-5 gap-2 p-2 border border-slate-200 rounded-md bg-slate-50 max-h-40 overflow-y-auto">
                ${Object.keys(PRESET_ICONS)
                  .filter((k) => k !== 'x' && k !== 'pencil')
                  .map((key) => {
                    const selected = formState.iconData === key;
                    return `
                      <button type="button" data-icon-key="${key}" class="p-2 rounded border flex items-center justify-center ${
                        selected ? 'bg-white border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
                      }">
                        ${renderIcon('preset', key, 'w-5 h-5')}
                      </button>
                    `;
                  })
                  .join('')}
              </div>
            </div>

            <div class="pt-3 flex items-center space-x-2">
              ${
                isEdit
                  ? `<button id="btn-delete-acc" type="button" class="px-4 py-2.5 border border-rose-200 text-rose-600 text-sm font-semibold rounded-md active:bg-rose-50">刪除</button>`
                  : ''
              }
              <button type="submit" class="flex-1 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-md active:bg-slate-700">
                儲存帳戶
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    bindEvents();
  }

  function syncInputs() {
    const nameEl = modalRoot.querySelector('#acc-name');
    const balEl = modalRoot.querySelector('#acc-balance');
    if (nameEl) formState.name = nameEl.value.trim();
    if (balEl) formState.initialBalance = balEl.value;
  }

  function bindEvents() {
    const backdrop = modalRoot.querySelector('#acc-modal-backdrop');
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    modalRoot.querySelector('#btn-close-acc-modal')?.addEventListener('click', closeModal);

    modalRoot.querySelector('#btn-pick-acc-type')?.addEventListener('click', () => {
      syncInputs();
      openSelectPicker({
        id: 'pick-acc-type',
        title: '選擇帳戶類型',
        selectedValue: formState.type,
        options: ACCOUNT_TYPES.map((t) => ({
          value: t.id,
          label: t.label
        })),
        onSelect: (val) => {
          formState.type = val;
          if (formState.type === 'credit') {
            formState.initialBalance = 0;
            if (!isEdit && formState.iconData === 'wallet') {
              formState.iconData = 'creditCard';
            }
          }
          renderModalContent();
        }
      });
    });

    modalRoot.querySelectorAll('[data-icon-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncInputs();
        formState.iconData = btn.dataset.iconKey;
        renderModalContent();
      });
    });

    modalRoot.querySelector('#btn-delete-acc')?.addEventListener('click', () => {
      if (!editingAccount) return;
      openConfirmModal({
        id: 'delete-acc-confirm',
        title: '刪除帳戶',
        message: `確定要刪除「${editingAccount.name}」帳戶嗎？刪除後無法復原。`,
        confirmText: '確定刪除',
        cancelText: '取消',
        isDanger: true,
        onConfirm: async () => {
          await deleteRecord(STORES.ACCOUNTS, editingAccount.id);
          closeModal();
          await refreshData();
        }
      });
    });

    modalRoot.querySelector('#acc-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      syncInputs();
      if (!formState.name) return;

      const isCredit = formState.type === 'credit';
      const record = {
        id: editingAccount?.id || `acc_${Date.now()}`,
        name: formState.name,
        type: formState.type,
        initialBalance: isCredit ? 0 : parseIntegerAmount(formState.initialBalance, true),
        iconType: 'preset',
        iconData: formState.iconData,
        createdAt: editingAccount?.createdAt || Date.now()
      };

      if (isEdit) {
        await updateRecord(STORES.ACCOUNTS, record);
      } else {
        await addRecord(STORES.ACCOUNTS, record);
      }

      closeModal();
      await refreshData();
    });
  }

  renderModalContent();
}