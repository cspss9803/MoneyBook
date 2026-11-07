import { STORES, ACCOUNT_TYPES } from '../config/constants.js';
import { PRESET_ICONS } from '../config/presetIcons.js';
import { refreshData } from '../state/refreshData.js';
import { addRecord } from '../db/addRecord.js';
import { updateRecord } from '../db/updateRecord.js';
import { deleteRecord } from '../db/deleteRecord.js';
import { parseIntegerAmount } from '../domain/parseIntegerAmount.js';
import { renderIcon } from './renderIcon.js';

export function renderAccountModal(editingAccount = null) {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    const isEdit = Boolean(editingAccount);
    const formState = {
        name: editingAccount?.name || '',
        type: editingAccount?.type || ACCOUNT_TYPES[0].id,
        initialBalance: editingAccount?.initialBalance ?? 0,
        iconType: 'preset',
        iconData: editingAccount?.iconData && PRESET_ICONS[editingAccount.iconData] ? editingAccount.iconData : 'wallet'
    };

    function renderModalContent() {
        modalRoot.innerHTML = `
            <div class="fixed inset-0 bg-slate-900/40 z-30 flex items-end justify-center">
                <div class="bg-white w-full max-w-md rounded-t-xl border-t border-slate-200 p-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                    <h2 class="text-base font-bold text-slate-900">${isEdit ? '編輯帳戶' : '新增帳戶'}</h2>
                    <button id="btn-close-acc-modal" type="button" class="text-sm text-slate-500 px-2 py-1">關閉</button>
                </div>

                <form id="acc-form" class="space-y-3">
                    <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">帳戶名稱</label>
                    <input id="acc-name" type="text" required placeholder="例如：台新銀行、玉山信用卡" value="${formState.name}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900" />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">帳戶類型</label>
                        <select id="acc-type" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900">
                        ${ACCOUNT_TYPES.map(
                            (t) => `<option value="${t.id}" ${t.id === formState.type ? 'selected' : ''}>${t.label}</option>`
                        ).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">初始資金 (整數元)</label>
                        <input id="acc-balance" type="number" step="1" required value="${formState.initialBalance}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold focus:outline-none focus:border-slate-900" />
                    </div>
                    </div>

                    <!-- 圖案選擇 -->
                    <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">帳戶圖案</label>
                    <div class="grid grid-cols-5 gap-2 p-2 border border-slate-200 rounded-md bg-slate-50 max-h-40 overflow-y-auto">
                        ${Object.keys(PRESET_ICONS)
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
                        ? `<button id="btn-delete-acc" type="button" class="px-4 py-2.5 border border-rose-200 text-rose-600 text-sm font-semibold rounded-md">刪除</button>`
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
        const typeEl = modalRoot.querySelector('#acc-type');
        const balEl = modalRoot.querySelector('#acc-balance');
        if (nameEl) formState.name = nameEl.value.trim();
        if (typeEl) formState.type = typeEl.value;
        if (balEl) formState.initialBalance = balEl.value;
    }

    function bindEvents() {
        modalRoot.querySelector('#btn-close-acc-modal')?.addEventListener('click', () => {
        modalRoot.innerHTML = '';
        });

        modalRoot.querySelectorAll('[data-icon-key]').forEach((btn) => {
            btn.addEventListener('click', () => {
                syncInputs();
                formState.iconData = btn.dataset.iconKey;
                renderModalContent();
            });
        });

        modalRoot.querySelector('#btn-delete-acc')?.addEventListener('click', async () => {
            if (!editingAccount) return;
            await deleteRecord(STORES.ACCOUNTS, editingAccount.id);
            modalRoot.innerHTML = '';
            await refreshData();
        });

        modalRoot.querySelector('#acc-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            syncInputs();
            if (!formState.name) return;

            const record = {
                id: editingAccount?.id || `acc_${Date.now()}`,
                name: formState.name,
                type: formState.type,
                initialBalance: parseIntegerAmount(formState.initialBalance, true),
                iconType: 'preset',
                iconData: formState.iconData,
                createdAt: editingAccount?.createdAt || Date.now()
            };

            if (isEdit) {
                await updateRecord(STORES.ACCOUNTS, record);
            } else {
                await addRecord(STORES.ACCOUNTS, record);
            }

            modalRoot.innerHTML = '';
            await refreshData();
        });
    }

    renderModalContent();
}