import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

export const useOverlayStore = defineStore('overlay', () => {
  const overlayStack = ref([]);

  function pushOverlay(id, closeFn, locked = false) {
    overlayStack.value = overlayStack.value.filter((item) => item.id !== id);
    overlayStack.value.push({ id, closeFn, locked: Boolean(locked) });
  }

  function popOverlay(id) {
    overlayStack.value = overlayStack.value.filter((item) => item.id !== id);
  }

  const confirmModal = reactive({
    open: false, id: 'confirm-modal', title: '確認操作', message: '',
    confirmText: '確定', cancelText: '取消', isDanger: false, lockBack: false,
    onConfirm: null, onCancel: null
  });

  function openConfirm(options = {}) {
    Object.assign(confirmModal, {
      open: true,
      id: options.id || 'confirm-modal',
      title: options.title || '確認操作',
      message: options.message || '',
      confirmText: options.confirmText || '確定',
      cancelText: options.cancelText || '取消',
      isDanger: Boolean(options.isDanger),
      lockBack: Boolean(options.lockBack),
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null
    });
    pushOverlay(confirmModal.id, closeConfirm, confirmModal.lockBack);
  }
  function closeConfirm() {
    confirmModal.open = false;
    popOverlay(confirmModal.id);
  }

  const datePicker = reactive({ open: false, id: 'date-picker', title: '選擇日期', selectedDateStr: '', onSelect: null });
  function openDatePicker(options = {}) {
    Object.assign(datePicker, {
      open: true, id: options.id || 'date-picker', title: options.title || '選擇日期',
      selectedDateStr: options.selectedDateStr || '', onSelect: options.onSelect || null
    });
    pushOverlay(datePicker.id, closeDatePicker);
  }
  function closeDatePicker() {
    datePicker.open = false;
    popOverlay(datePicker.id);
  }

  const selectPicker = reactive({ open: false, id: 'select-picker', title: '請選擇', options: [], selectedValue: '', onSelect: null });
  function openSelectPicker(options = {}) {
    Object.assign(selectPicker, {
      open: true, id: options.id || 'select-picker', title: options.title || '請選擇',
      options: options.options || [], selectedValue: options.selectedValue ?? '', onSelect: options.onSelect || null
    });
    pushOverlay(selectPicker.id, closeSelectPicker);
  }
  function closeSelectPicker() {
    selectPicker.open = false;
    popOverlay(selectPicker.id);
  }

  const txModal = reactive({ open: false, editingTx: null });
  const accountModal = reactive({ open: false, editingAccount: null });
  const stockModal = reactive({ open: false, stockAccount: null });
  const categoryModal = reactive({ open: false, editingCategory: null, defaultType: 'expense' });

  function openTxModal(editingTx = null) {
    txModal.editingTx = editingTx;
    txModal.open = true;
    pushOverlay('tx-modal', closeTxModal);
  }
  function closeTxModal() {
    txModal.open = false;
    txModal.editingTx = null;
    popOverlay('tx-modal');
  }

  function openAccountModal(editingAccount = null) {
    accountModal.editingAccount = editingAccount;
    accountModal.open = true;
    pushOverlay('acc-modal', closeAccountModal);
  }
  function closeAccountModal() {
    accountModal.open = false;
    accountModal.editingAccount = null;
    popOverlay('acc-modal');
  }

  function openStockModal(stockAccount) {
    stockModal.stockAccount = stockAccount;
    stockModal.open = true;
    pushOverlay('stock-modal', closeStockModal);
  }
  function closeStockModal() {
    stockModal.open = false;
    stockModal.stockAccount = null;
    popOverlay('stock-modal');
  }

  function openCategoryModal(editingCategory = null, defaultType = 'expense') {
    if (editingCategory?.isSystem || editingCategory?.id === 'cat_sys_repayment') return;
    categoryModal.editingCategory = editingCategory;
    categoryModal.defaultType = defaultType;
    categoryModal.open = true;
    pushOverlay('cat-modal', closeCategoryModal);
  }
  function closeCategoryModal() {
    categoryModal.open = false;
    categoryModal.editingCategory = null;
    popOverlay('cat-modal');
  }

  return {
    overlayStack, pushOverlay, popOverlay,
    confirmModal, openConfirm, closeConfirm,
    datePicker, openDatePicker, closeDatePicker,
    selectPicker, openSelectPicker, closeSelectPicker,
    txModal, openTxModal, closeTxModal,
    accountModal, openAccountModal, closeAccountModal,
    stockModal, openStockModal, closeStockModal,
    categoryModal, openCategoryModal, closeCategoryModal
  };
});
