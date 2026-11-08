import { STORES, TRANSACTION_TYPES, ACCOUNT_TYPES } from '../config/constants.js';
import { store } from '../state/store.js';
import { refreshData } from '../state/refreshData.js';
import { addRecord } from '../db/addRecord.js';
import { updateRecord } from '../db/updateRecord.js';
import { deleteRecord } from '../db/deleteRecord.js';
import { parseIntegerAmount } from '../domain/parseIntegerAmount.js';
import { formatCurrency } from '../domain/formatCurrency.js';
import { calculateReceivables } from '../domain/calculateReceivables.js';
import { renderIcon } from './renderIcon.js';
import { pushOverlay } from './pushOverlay.js';
import { popOverlay } from './popOverlay.js';
import { openSelectPicker } from './openSelectPicker.js';
import { openDatePicker } from './openDatePicker.js';

export function renderTransactionModal(editingTx = null) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  let isEdit = Boolean(editingTx);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const accountTypeMap = new Map(ACCOUNT_TYPES.map((t) => [t.id, t.label]));
  const categoryMap = new Map(store.categories.map((c) => [c.id, c]));

  // 計算目前所有代墊紀錄的待收餘額 (若正在編輯某筆還款，先排除該筆還款自身金額以便正確顯示原欠款)
  const txForReceivables = isEdit
    ? store.transactions.filter((t) => t.id !== editingTx.id)
    : store.transactions;
  const { advanceMap } = calculateReceivables(txForReceivables, null);

  const initTotal = editingTx?.amount || '';
  const initOther = Math.round(Number(editingTx?.otherAmount) || 0);
  const initMy = initTotal !== '' ? Math.max(0, Number(initTotal) - initOther) : '';

  const formState = {
    type: editingTx?.type || 'expense',
    amount: initTotal,
    hasSplit: initOther >= 1,
    myAmount: initMy,
    otherAmount: initOther >= 1 ? initOther : '',
    repayTargetId: editingTx?.repayTargetId || '',
    name: editingTx?.name || '',
    date: editingTx?.date || todayStr,
    accountId: editingTx?.accountId || '',
    toAccountId: editingTx?.toAccountId || '',
    categoryId: editingTx?.categoryId || '',
    note: editingTx?.note || '',
    excludeFromStats: Boolean(editingTx?.excludeFromStats)
  };

  function closeModal() {
    modalRoot.innerHTML = '';
    popOverlay('tx-modal');
  }

  pushOverlay('tx-modal', closeModal);

  function getAllowedFromAccounts() {
    if (formState.type === 'income' || formState.type === 'transfer') {
      return store.accounts.filter((a) => a.type !== 'credit');
    }
    return store.accounts;
  }

  function getAdvanceExpenseCandidates() {
    return store.transactions
      .filter((tx) => tx.type === 'expense' && (tx.otherAmount || 0) >= 1)
      .map((tx) => {
        const info = advanceMap.get(tx.id);
        const remaining = info ? info.remainingOwed : tx.otherAmount;
        const repaid = info ? info.repaidAmount : 0;
        const catName = categoryMap.get(tx.categoryId)?.name || '支出';
        return {
          tx,
          title: tx.name || catName,
          remaining,
          repaid,
          advanced: tx.otherAmount
        };
      })
      .sort((a, b) => {
        if ((b.remaining > 0) !== (a.remaining > 0)) return b.remaining > 0 ? 1 : -1;
        return b.tx.date.localeCompare(a.tx.date);
      });
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

    if (formState.type === 'income' && formState.categoryId === 'cat_sys_repayment') {
      const candidates = getAdvanceExpenseCandidates();
      if (!candidates.some((c) => c.tx.id === formState.repayTargetId)) {
        const firstUnsettled = candidates.find((c) => c.remaining > 0) || candidates[0];
        formState.repayTargetId = firstUnsettled?.tx.id || '';
        if (!formState.amount && firstUnsettled?.remaining > 0) {
          formState.amount = firstUnsettled.remaining;
        }
      }
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
    const isRepayment = formState.type === 'income' && formState.categoryId === 'cat_sys_repayment';
    const availableCategories = store.categories.filter((c) => c.type === formState.type);
    const fromAccountObj = store.accounts.find((a) => a.id === formState.accountId);
    const toAccountObj = store.accounts.find((a) => a.id === formState.toAccountId);

    const candidates = isRepayment ? getAdvanceExpenseCandidates() : [];
    const selectedTarget = candidates.find((c) => c.tx.id === formState.repayTargetId);

    // 若目前正在檢視一筆「尚有欠款未收齊」的代墊支出，提供一鍵「記一筆還款」快捷鈕
    const currentEditAdvanceInfo = isEdit && editingTx ? advanceMap.get(editingTx.id) : null;
    const canQuickRepay = Boolean(
      isEdit &&
      formState.type === 'expense' &&
      currentEditAdvanceInfo &&
      currentEditAdvanceInfo.remainingOwed > 0
    );

    modalRoot.innerHTML = `
      <div id="tx-modal-backdrop" class="fixed inset-0 bg-slate-900/40 z-30 flex items-end justify-center">
        <div class="bg-white w-full max-w-md rounded-t-xl border-t border-slate-200 p-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <h2 class="text-base font-bold text-slate-900">${isEdit ? '編輯紀錄' : '新增紀錄'}</h2>
            <button id="btn-close-tx-modal" type="button" aria-label="關閉" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-md active:bg-slate-100">
              ${renderIcon('preset', 'x', 'w-5 h-5')}
            </button>
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
            <!-- 金額與日期 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">總金額 (整數元)</label>
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

            <!-- 金額劃分 (支出代墊 / 收入分帳) -->
            ${
              !isTransfer && !isRepayment
                ? `
              <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-xs font-medium text-slate-700">
                    ${formState.type === 'expense' ? '此筆支出含幫人代墊（劃分個人與他人金額）' : '此筆收入含他人份額（劃分個人與他人金額）'}
                  </span>
                  <input id="tx-has-split" type="checkbox" ${formState.hasSplit ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0" />
                </label>
                ${
                  formState.hasSplit
                    ? `
                  <div class="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label class="block text-[11px] text-slate-500 mb-1">屬於自己 (元)</label>
                      <input id="tx-my-amount" type="number" step="1" min="0" placeholder="0" value="${formState.myAmount}" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:border-slate-900" />
                    </div>
                    <div>
                      <label class="block text-[11px] text-slate-500 mb-1">${formState.type === 'expense' ? '幫人代墊 / 應收 (元)' : '他人份額 (元)'}</label>
                      <input id="tx-other-amount" type="number" step="1" min="0" placeholder="0" value="${formState.otherAmount}" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-amber-700 focus:outline-none focus:border-slate-900" />
                    </div>
                  </div>
                  <div class="text-[11px] text-slate-500">
                    ${
                      formState.type === 'expense'
                        ? '幫人代墊滿 1 元以上會標記為「應收帳款」，待收到「還款」後將自動從支出統計中扣除。'
                        : '統計收入時僅會計算「屬於自己」的金額，但帳戶實際入帳仍以總金額計算。'
                    }
                  </div>
                `
                    : ''
                }
              </div>
            `
                : ''
            }

            <!-- 還款專屬：指定代墊紀錄選擇器 -->
            ${
              isRepayment
                ? `
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                <label class="block text-xs font-semibold text-slate-800">指定要沖銷的代墊紀錄</label>
                <button id="btn-pick-repay-target" type="button" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 flex items-center justify-between active:bg-slate-50">
                  <span class="truncate font-medium">
                    ${
                      selectedTarget
                        ? `${selectedTarget.tx.date} · ${selectedTarget.title} (尚欠 ${formatCurrency(selectedTarget.remaining)})`
                        : '請選擇一筆代墊紀錄'
                    }
                  </span>
                  <svg class="w-4 h-4 text-slate-400 shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div class="text-[11px] text-slate-500 leading-relaxed">
                  還款預設不計入一般收入，會直接扣抵該筆代墊在統計中的支出；若還款超過欠款，多出的金額會自動歸入「溢出還款」。
                </div>
              </div>
            `
                : ''
            }

            <!-- 項目名稱 -->
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">項目名稱</label>
              <input id="tx-name" type="text" placeholder="${isTransfer ? '例如：繳信用卡費、ATM 提款' : isRepayment ? '例如：朋友還聚餐費' : '選填，未填則顯示類別名稱'}" value="${formState.name}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900" />
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
                <label class="block text-xs font-medium text-slate-600 mb-1">${isRepayment ? '收款帳戶 (不含信用卡)' : `所屬帳戶${formState.type === 'income' ? ' (信用卡不可存入收入)' : ''}`}</label>
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
              !isTransfer && !isRepayment
                ? `
              <label class="flex items-center space-x-2 pt-1 cursor-pointer">
                <input id="tx-exclude" type="checkbox" ${formState.excludeFromStats ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0" />
                <span class="text-xs text-slate-700">此筆紀錄排除於統計圖表之外</span>
              </label>
            `
                : ''
            }

            <div id="tx-error" class="text-xs text-rose-600 hidden"></div>

            <!-- 若此筆為尚未收齊的代墊支出，提供一鍵新增還款按鈕 -->
            ${
              canQuickRepay
                ? `
              <div class="pt-1">
                <button id="btn-quick-repay" type="button" class="w-full py-2 px-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold rounded-md active:bg-teal-100">
                  ＋ 針對此筆代墊記一筆「還款」收入 (尚欠 ${formatCurrency(currentEditAdvanceInfo.remainingOwed)})
                </button>
              </div>
            `
                : ''
            }

            <!-- 底部操作按鈕 -->
            <div class="pt-2 flex items-center space-x-2">
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
    const myAmtEl = modalRoot.querySelector('#tx-my-amount');
    const otherAmtEl = modalRoot.querySelector('#tx-other-amount');
    const nameEl = modalRoot.querySelector('#tx-name');
    const noteEl = modalRoot.querySelector('#tx-note');
    const excludeEl = modalRoot.querySelector('#tx-exclude');

    if (amountEl) formState.amount = amountEl.value;
    if (myAmtEl) formState.myAmount = myAmtEl.value;
    if (otherAmtEl) formState.otherAmount = otherAmtEl.value;
    if (nameEl) formState.name = nameEl.value.trim();
    if (noteEl) formState.note = noteEl.value.trim();
    if (excludeEl) formState.excludeFromStats = excludeEl.checked;
  }

  function bindModalEvents() {
    const backdrop = modalRoot.querySelector('#tx-modal-backdrop');
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    modalRoot.querySelector('#btn-close-tx-modal')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });

    // 總金額與「屬於自己 / 他人代墊」雙向即時換算
    const amountEl = modalRoot.querySelector('#tx-amount');
    const myAmtEl = modalRoot.querySelector('#tx-my-amount');
    const otherAmtEl = modalRoot.querySelector('#tx-other-amount');

    amountEl?.addEventListener('input', () => {
      formState.amount = amountEl.value;
      if (formState.hasSplit && myAmtEl && otherAmtEl) {
        const total = Math.max(0, Math.round(Number(amountEl.value) || 0));
        const other = Math.min(total, Math.max(0, Math.round(Number(otherAmtEl.value) || 0)));
        const my = Math.max(0, total - other);
        formState.otherAmount = other;
        formState.myAmount = my;
        myAmtEl.value = my;
        otherAmtEl.value = other;
      }
    });

    myAmtEl?.addEventListener('input', () => {
      const total = Math.max(0, Math.round(Number(amountEl?.value) || 0));
      const my = Math.min(total, Math.max(0, Math.round(Number(myAmtEl.value) || 0)));
      const other = Math.max(0, total - my);
      formState.myAmount = my;
      formState.otherAmount = other;
      if (otherAmtEl) otherAmtEl.value = other;
    });

    otherAmtEl?.addEventListener('input', () => {
      const total = Math.max(0, Math.round(Number(amountEl?.value) || 0));
      const other = Math.min(total, Math.max(0, Math.round(Number(otherAmtEl.value) || 0)));
      const my = Math.max(0, total - other);
      formState.otherAmount = other;
      formState.myAmount = my;
      if (myAmtEl) myAmtEl.value = my;
    });

    modalRoot.querySelector('#tx-has-split')?.addEventListener('change', (e) => {
      syncInputsToState();
      formState.hasSplit = e.target.checked;
      if (formState.hasSplit) {
        const total = Math.max(0, Math.round(Number(formState.amount) || 0));
        const other = Math.min(total, Math.max(0, Math.round(Number(formState.otherAmount) || 0)));
        formState.otherAmount = other || '';
        formState.myAmount = Math.max(0, total - other);
      } else {
        formState.otherAmount = '';
        formState.myAmount = formState.amount;
      }
      renderModalContent();
    });

    modalRoot.querySelector('#btn-pick-repay-target')?.addEventListener('click', () => {
      syncInputsToState();
      const candidates = getAdvanceExpenseCandidates();
      openSelectPicker({
        id: 'pick-repay-target',
        title: '選擇要還款的代墊紀錄',
        selectedValue: formState.repayTargetId,
        options: candidates.map((c) => ({
          value: c.tx.id,
          label: `${c.tx.date} · ${c.title}`,
          subLabel: `代墊 ${formatCurrency(c.advanced)} · 已還 ${formatCurrency(c.repaid)} · 尚欠 ${formatCurrency(c.remaining)}`,
          icon: categoryMap.get(c.tx.categoryId)?.iconData || 'tag'
        })),
        onSelect: (val) => {
          formState.repayTargetId = val;
          const targetObj = candidates.find((c) => c.tx.id === val);
          if (targetObj && targetObj.remaining > 0) {
            formState.amount = targetObj.remaining;
          }
          renderModalContent();
        }
      });
    });

    modalRoot.querySelector('#btn-quick-repay')?.addEventListener('click', () => {
      if (!editingTx || !currentEditAdvanceInfo) return;
      const targetTitle = editingTx.name || categoryMap.get(editingTx.categoryId)?.name || '代墊款';
      editingTx = null;
      isEdit = false;
      formState.type = 'income';
      formState.categoryId = 'cat_sys_repayment';
      formState.repayTargetId = currentEditAdvanceInfo.txId;
      formState.amount = currentEditAdvanceInfo.remainingOwed;
      formState.name = `收回：${targetTitle}`;
      formState.date = todayStr;
      formState.hasSplit = false;
      formState.otherAmount = '';
      ensureValidSelections();
      renderModalContent();
    });

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
        title: formState.type === 'transfer' ? '選擇轉出帳戶' : '選擇帳戶',
        selectedValue: formState.accountId,
        options: allowedFrom.map((acc) => ({
          value: acc.id,
          label: acc.name,
          subLabel: accountTypeMap.get(acc.type) || '',
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
          subLabel: accountTypeMap.get(acc.type) || '',
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
        ensureValidSelections();
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
      const isRepayment = formState.type === 'income' && formState.categoryId === 'cat_sys_repayment';

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

      if (isRepayment && !formState.repayTargetId) {
        errorEl.textContent = '請先選擇要沖銷的代墊支出紀錄';
        errorEl.classList.remove('hidden');
        return;
      }

      const totalAmount = parseIntegerAmount(formState.amount, false);
      let otherAmount = 0;
      let myAmount = totalAmount;

      if (formState.type !== 'transfer' && !isRepayment && formState.hasSplit) {
        otherAmount = Math.min(totalAmount, Math.max(0, Math.round(Number(formState.otherAmount) || 0)));
        myAmount = Math.max(0, totalAmount - otherAmount);
      }

      const record = {
        id: editingTx?.id || `tx_${Date.now()}`,
        type: formState.type,
        amount: totalAmount,
        myAmount,
        otherAmount,
        repayTargetId: isRepayment ? formState.repayTargetId : null,
        name: formState.name,
        date: formState.date,
        accountId: formState.accountId,
        toAccountId: formState.type === 'transfer' ? formState.toAccountId : null,
        categoryId: formState.type === 'transfer' ? null : formState.categoryId,
        note: formState.note,
        excludeFromStats: formState.type === 'transfer' ? true : isRepayment ? false : Boolean(formState.excludeFromStats),
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