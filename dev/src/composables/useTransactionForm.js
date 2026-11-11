import { reactive, ref, computed, watch } from 'vue';
import { ACCOUNT_TYPES } from '../config/constants.js';
import { calculateReceivables } from '../domain/calculateReceivables.js';
import { buildAdvanceCandidateOptions } from '../domain/transactionService.js';
import { useLedgerStore } from '../stores/useLedgerStore.js';

export function useTransactionForm(modalState) {
  const ledgerStore = useLedgerStore();
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const accountTypeMap = new Map(ACCOUNT_TYPES.map((t) => [t.id, t.label]));

  const localEditingTx = ref(null);
  const errorMsg = ref('');
  const form = reactive({
    type: 'expense', amount: '', hasSplit: false, myAmount: '', otherAmount: '',
    repayTargetId: '', name: '', date: todayStr, accountId: '', toAccountId: '',
    categoryId: '', note: '', excludeFromStats: false
  });

  const isEdit = computed(() => Boolean(localEditingTx.value));
  const isTransfer = computed(() => form.type === 'transfer');
  const isRepayment = computed(() => form.type === 'income' && form.categoryId === 'cat_sys_repayment');
  const availableCategories = computed(() => ledgerStore.categories.filter((c) => c.type === form.type));

  const toAccountOptions = computed(() =>
    ledgerStore.accounts.filter((a) => a.type !== 'stock').map((a) => ({
      value: a.id, label: a.name, subLabel: accountTypeMap.get(a.type), icon: a.iconData
    }))
  );

  const fromAccountOptions = computed(() =>
    toAccountOptions.value.filter((opt) =>
      form.type !== 'expense' ? ledgerStore.accountMap.get(opt.value)?.type !== 'credit' : true
    )
  );

  const advanceOptions = computed(() => {
    const list = isEdit.value
      ? ledgerStore.transactions.filter((t) => t.id !== localEditingTx.value.id)
      : ledgerStore.transactions;
    const { advanceMap } = calculateReceivables(list, null);
    return buildAdvanceCandidateOptions(ledgerStore.transactions, advanceMap, ledgerStore.categoryMap);
  });

  const currentEditAdvanceInfo = computed(() =>
    isEdit.value ? calculateReceivables(ledgerStore.transactions, null).advanceMap.get(localEditingTx.value.id) : null
  );

  function ensureValidSelections() {
    if (!fromAccountOptions.value.some((a) => a.value === form.accountId)) {
      form.accountId = fromAccountOptions.value[0]?.value || '';
    }
    if (isTransfer.value) {
      if (!toAccountOptions.value.some((a) => a.value === form.toAccountId) || form.toAccountId === form.accountId) {
        form.toAccountId = toAccountOptions.value.find((a) => a.value !== form.accountId)?.value || '';
      }
      return;
    }
    if (!availableCategories.value.some((c) => c.id === form.categoryId)) {
      form.categoryId = availableCategories.value[0]?.id || '';
    }
    if (isRepayment.value && !advanceOptions.value.some((c) => c.value === form.repayTargetId)) {
      const first = advanceOptions.value.find((c) => c.remaining > 0) || advanceOptions.value[0];
      form.repayTargetId = first?.value || '';
      if (!form.amount && first?.remaining > 0) form.amount = first.remaining;
    }
  }

  watch(() => [form.type, form.categoryId], ensureValidSelections);

  watch(() => modalState.open, (isOpen) => {
    if (!isOpen) return;
    errorMsg.value = '';
    const tx = modalState.editingTx;
    localEditingTx.value = tx || null;
    const initTotal = tx?.amount || '';
    const initOther = Math.round(Number(tx?.otherAmount) || 0);

    Object.assign(form, {
      type: tx?.type || 'expense', amount: initTotal, hasSplit: initOther >= 1,
      myAmount: initTotal !== '' ? Math.max(0, Number(initTotal) - initOther) : '',
      otherAmount: initOther >= 1 ? initOther : '', repayTargetId: tx?.repayTargetId || '',
      name: tx?.name || '', date: tx?.date || todayStr, accountId: tx?.accountId || '',
      toAccountId: tx?.toAccountId || '', categoryId: tx?.categoryId || '',
      note: tx?.note || '', excludeFromStats: Boolean(tx?.excludeFromStats)
    });
    ensureValidSelections();
  });

  function switchToQuickRepay() {
    const info = currentEditAdvanceInfo.value;
    const tx = localEditingTx.value;
    const txName = tx?.name || ledgerStore.categoryMap.get(tx?.categoryId)?.name || '代墊款';
    localEditingTx.value = null;
    Object.assign(form, {
      type: 'income', categoryId: 'cat_sys_repayment', repayTargetId: info.txId,
      amount: info.remainingOwed, name: `收回：${txName}`, date: todayStr, hasSplit: false, otherAmount: ''
    });
  }

  return {
    form, localEditingTx, isEdit, isTransfer, isRepayment, errorMsg,
    availableCategories, fromAccountOptions, toAccountOptions, advanceOptions,
    currentEditAdvanceInfo, switchToQuickRepay
  };
}
