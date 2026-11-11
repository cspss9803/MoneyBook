<script setup>
import { reactive, ref, computed, watch } from 'vue';
import { STORES, ACCOUNT_TYPES } from '../../config/constants.js';
import { addRecord } from '../../db/addRecord.js';
import { updateRecord } from '../../db/updateRecord.js';
import { deleteRecord } from '../../db/deleteRecord.js';
import { parseIntegerAmount } from '../../domain/parseIntegerAmount.js';
import { useLedgerStore } from '../../stores/useLedgerStore.js';
import { useOverlayStore } from '../../stores/useOverlayStore.js';
import BaseBottomSheet from '../ui/BaseBottomSheet.vue';
import BaseInput from '../ui/BaseInput.vue';
import FormSelect from '../ui/FormSelect.vue';
import FormSubmitBar from '../ui/FormSubmitBar.vue';
import IconPickerGrid from '../ui/IconPickerGrid.vue';

const ledgerStore = useLedgerStore();
const overlayStore = useOverlayStore();
const modalState = overlayStore.accountModal;
const isEdit = computed(() => Boolean(modalState.editingAccount));
const errorMsg = ref('');

const typeOptions = ACCOUNT_TYPES.map((t) => ({ value: t.id, label: t.label }));
const bankOptions = computed(() =>
  ledgerStore.accounts.filter((a) => a.type === 'virtual').map((b) => ({ value: b.id, label: b.name, icon: b.iconData }))
);

const form = reactive({
  name: '', type: 'cash', initialBalance: 0, settlementAccountId: '',
  feeDiscount: 10, deductSellFeeInValue: false, iconData: 'wallet'
});

watch(() => modalState.open, (isOpen) => {
  if (!isOpen) return;
  errorMsg.value = '';
  const acc = modalState.editingAccount;
  Object.assign(form, {
    name: acc?.name || '', type: acc?.type || 'cash',
    initialBalance: acc?.initialBalance ?? 0,
    settlementAccountId: acc?.settlementAccountId || bankOptions.value[0]?.value || '',
    feeDiscount: acc?.feeDiscount ?? 10,
    deductSellFeeInValue: Boolean(acc?.deductSellFeeInValue),
    iconData: acc?.iconData || 'wallet'
  });
});

function onTypeChange(val) {
  if (val === 'credit' && !isEdit.value) form.iconData = 'creditCard';
  if (val === 'stock' && !isEdit.value) form.iconData = 'trendingUp';
}

function handleDelete() {
  const acc = modalState.editingAccount;
  overlayStore.openConfirm({
    id: 'delete-acc-confirm',
    title: '刪除帳戶',
    message: `確定要刪除「${acc.name}」帳戶嗎？刪除後無法復原。`,
    confirmText: '確定刪除',
    isDanger: true,
    onConfirm: async () => {
      await deleteRecord(STORES.ACCOUNTS, acc.id);
      overlayStore.closeAccountModal();
      await ledgerStore.refreshData();
    }
  });
}

async function handleSubmit() {
  const isStock = form.type === 'stock';
  if (isStock && !form.settlementAccountId) return (errorMsg.value = '請先建立一個「銀行帳戶」作為股票交割戶');
  const acc = modalState.editingAccount;
  const record = {
    id: acc?.id || `acc_${Date.now()}`, name: form.name.trim(), type: form.type,
    initialBalance: form.type === 'credit' || isStock ? 0 : parseIntegerAmount(form.initialBalance, true),
    settlementAccountId: isStock ? form.settlementAccountId : null,
    feeDiscount: isStock ? (Number(form.feeDiscount) || 10) : null,
    deductSellFeeInValue: isStock ? Boolean(form.deductSellFeeInValue) : false,
    iconType: 'preset', iconData: form.iconData, createdAt: acc?.createdAt || Date.now()
  };
  if (isEdit.value) await updateRecord(STORES.ACCOUNTS, record);
  else await addRecord(STORES.ACCOUNTS, record);
  overlayStore.closeAccountModal();
  await ledgerStore.refreshData();
}
</script>

<template>
  <BaseBottomSheet :open="modalState.open" :title="isEdit ? '編輯帳戶' : '新增帳戶'" @close="overlayStore.closeAccountModal()">
    <form @submit.prevent="handleSubmit" class="space-y-3">
      <BaseInput v-model="form.name" label="帳戶名稱" required placeholder="例如：台新銀行、國泰證券" />
      <div :class="['grid gap-3', form.type === 'credit' || form.type === 'stock' ? 'grid-cols-1' : 'grid-cols-2']">
        <FormSelect v-model="form.type" @change="onTypeChange" label="帳戶類型" :options="typeOptions" />
        <BaseInput v-if="form.type !== 'credit' && form.type !== 'stock'" v-model.number="form.initialBalance" label="初始資金 (整數元)" type="number" step="1" bold required />
      </div>

      <div v-if="form.type === 'credit'" class="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-2.5">
        信用卡無初始金額，僅能紀錄「支出」消費，並由其他帳戶透過「轉移」轉入此卡進行還款。
      </div>

      <div v-if="form.type === 'stock'" class="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-3">
        <FormSelect v-model="form.settlementAccountId" label="綁定交割銀行帳戶 (必選)" :options="bankOptions" placeholder="請先建立一個「銀行帳戶」" />
        <div>
          <BaseInput v-model.number="form.feeDiscount" label="券商手續費折數 (1 ~ 10 折)" type="number" step="0.01" min="0.1" max="10" bold required />
          <p class="text-[11px] text-slate-500 mt-1">台股法定手續費率為 0.1425%，系統會依此折數並以「無條件捨去法（最低 1 元）」自動計算手續費。</p>
        </div>
        <label class="flex items-center space-x-2 pt-1 border-t border-slate-200 cursor-pointer">
          <input v-model="form.deductSellFeeInValue" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-slate-900" />
          <span class="text-xs font-medium text-slate-700">計算現值與損益時，預先扣除賣出手續費與證交稅（逐筆計算、手續費最低 1 元）</span>
        </label>
      </div>

      <IconPickerGrid v-model="form.iconData" label="帳戶圖案" />
      <FormSubmitBar :isEdit="isEdit" :error="errorMsg" submitText="儲存帳戶" @delete="handleDelete" />
    </form>
  </BaseBottomSheet>
</template>
