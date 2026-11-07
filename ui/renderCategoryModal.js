import { STORES } from '../config/constants.js';
import { PRESET_COLORS } from '../config/presetColors.js';
import { PRESET_ICONS } from '../config/presetIcons.js';
import { refreshData } from '../state/refreshData.js';
import { addRecord } from '../db/addRecord.js';
import { updateRecord } from '../db/updateRecord.js';
import { deleteRecord } from '../db/deleteRecord.js';
import { renderIcon } from './renderIcon.js';

export function renderCategoryModal(editingCategory = null, defaultType = 'expense') {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    const isEdit = Boolean(editingCategory);
    const formState = {
        type: editingCategory?.type || defaultType,
        name: editingCategory?.name || '',
        color: editingCategory?.color || PRESET_COLORS[0],
        iconType: 'preset',
        iconData: editingCategory?.iconData && PRESET_ICONS[editingCategory.iconData] ? editingCategory.iconData : 'tag'
    };

    function renderModalContent() {
        modalRoot.innerHTML = `
            <div class="fixed inset-0 bg-slate-900/40 z-30 flex items-end justify-center">
                <div class="bg-white w-full max-w-md rounded-t-xl border-t border-slate-200 p-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                    <h2 class="text-base font-bold text-slate-900">${isEdit ? '編輯類別' : '新增類別'}</h2>
                    <button id="btn-close-cat-modal" type="button" class="text-sm text-slate-500 px-2 py-1">關閉</button>
                </div>

                <form id="cat-form" class="space-y-3">
                    <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-600 mb-1">類型</label>
                        <select id="cat-type" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900">
                        <option value="expense" ${formState.type === 'expense' ? 'selected' : ''}>支出</option>
                        <option value="income" ${formState.type === 'income' ? 'selected' : ''}>收入</option>
                        </select>
                    </div>
                    <div class="col-span-2">
                        <label class="block text-xs font-medium text-slate-600 mb-1">類別名稱</label>
                        <input id="cat-name" type="text" required placeholder="例如：早餐、股息" value="${formState.name}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900" />
                    </div>
                    </div>

                    <!-- 預覽列 -->
                    <div class="flex items-center space-x-3 p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                    <div class="w-9 h-9 rounded flex items-center justify-center text-white shrink-0" style="background-color: ${formState.color}">
                        ${renderIcon('preset', formState.iconData, 'w-5 h-5')}
                    </div>
                    <div class="text-xs text-slate-600">
                        <div class="font-semibold text-slate-900">${formState.name || '類別預覽'}</div>
                        <div>色碼：${formState.color}</div>
                    </div>
                    </div>

                    <!-- 顏色挑選與自訂色碼 -->
                    <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="text-xs font-medium text-slate-600">代表顏色</label>
                        <label class="text-xs text-slate-700 underline cursor-pointer flex items-center space-x-1">
                        <span>自訂顏色</span>
                        <input id="cat-custom-color" type="color" value="${formState.color}" class="w-4 h-4 border-0 p-0 bg-transparent cursor-pointer" />
                        </label>
                    </div>
                    <div class="grid grid-cols-7 gap-2 p-2 border border-slate-200 rounded-md bg-slate-50">
                        ${PRESET_COLORS.map((hex) => {
                        const selected = formState.color.toLowerCase() === hex.toLowerCase();
                        return `
                            <button type="button" data-color-hex="${hex}" class="w-7 h-7 rounded-full mx-auto border-2 ${
                            selected ? 'border-slate-900 scale-110' : 'border-transparent'
                            }" style="background-color: ${hex}"></button>
                        `;
                        }).join('')}
                    </div>
                    </div>

                    <!-- 圖案選擇 -->
                    <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">代表圖案</label>
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
                        ? `<button id="btn-delete-cat" type="button" class="px-4 py-2.5 border border-rose-200 text-rose-600 text-sm font-semibold rounded-md">刪除</button>`
                        : ''
                    }
                    <button type="submit" class="flex-1 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-md active:bg-slate-700">
                        儲存類別
                    </button>
                    </div>
                </form>
                </div>
            </div>
        `;

        bindEvents();
    }

    function syncInputs() {
        const typeEl = modalRoot.querySelector('#cat-type');
        const nameEl = modalRoot.querySelector('#cat-name');
        if (typeEl) formState.type = typeEl.value;
        if (nameEl) formState.name = nameEl.value.trim();
    }

    function bindEvents() {
        modalRoot.querySelector('#btn-close-cat-modal')?.addEventListener('click', () => {
            innerHTML = '';
        });

        modalRoot.querySelectorAll('[data-color-hex]').forEach((btn) => {
            btn.addEventListener('click', () => {
                syncInputs();
                formState.color = btn.dataset.colorHex;
                renderModalContent();
            });
        });

        modalRoot.querySelector('#cat-custom-color')?.addEventListener('input', (e) => {
            syncInputs();
            formState.color = e.target.value;
            renderModalContent();
        });

        modalRoot.querySelectorAll('[data-icon-key]').forEach((btn) => {
            btn.addEventListener('click', () => {
                syncInputs();
                formState.iconData = btn.dataset.iconKey;
                renderModalContent();
            });
        });

        modalRoot.querySelector('#btn-delete-cat')?.addEventListener('click', async () => {
            if (!editingCategory) return;
            await deleteRecord(STORES.CATEGORIES, editingCategory.id);
            modalRoot.innerHTML = '';
            await refreshData();
        });

        modalRoot.querySelector('#cat-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            syncInputs();
            if (!formState.name) return;

            const record = {
                id: editingCategory?.id || `cat_${Date.now()}`,
                type: formState.type,
                name: formState.name,
                color: formState.color,
                iconType: 'preset',
                iconData: formState.iconData,
                createdAt: editingCategory?.createdAt || Date.now()
            };

            if (isEdit) {
                await updateRecord(STORES.CATEGORIES, record);
            } else {
                await addRecord(STORES.CATEGORIES, record);
            }

            modalRoot.innerHTML = '';
            await refreshData();
        });
    }

    renderModalContent();
}