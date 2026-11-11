<script setup>
import { STORES, TRANSACTION_TYPES } from '../../../config/constants.js';
import { deleteRecord } from '../../../db/deleteRecord.js';
import { formatCurrency } from '../../../domain/formatCurrency.js';
import { saveTransactionRecord } from '../../../domain/transactionService.js';
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import { useOverlayStore } from '../../../stores/useOverlayStore.js';
import { useTransactionForm } from '../../../composables/useTransactionForm.js';
import BaseBottomSheet from '../../ui/BaseBottomSheet.vue';
import BaseSegmented from '../../ui/BaseSegmented.vue';
import BaseInput from '../../ui/BaseInput.vue';
import FormDatePicker from '../../ui/FormDatePicker.vue';
import FormSelect from '../../ui/FormSelect.vue';
import FormSubmitBar from '../../ui/FormSubmitBar.vue';
import CategoryPickerGrid from '../../ui/CategoryPickerGrid.vue';
import SplitAmountBox from './SplitAmountBox.vue';

const ledgerStore = useLedgerStore();
const overlayStore = useOverlayStore();
const txTypeOptions = TRANSACTION_TYPES.map((t) => ({ label: t.label, value: t.id }));

const {
  form, localEditingTx, isEdit, isTransfer, isRepayment, errorMsg,
  availableCategories, fromAccountOptions, toAccountOptions, advanceOptions,
  currentEditAdvanceInfo, switchToQuickRepay
} = useTransactionForm(overlayStore.txModal);

function onAmountInput() {
  if (form.hasSplit) {
    const total = Math.max(0, Math.round(Number(form.amount) || 0));
    const other = Math.min(total, Math.max(0, Math.round(Number(form.otherAmount) || 0)));
    form.otherAmount = other;
    form.myAmount = Math.max(0, total - other);
  }
}

function handleDelete() {
  const tx = localEditingTx.value;
  overlayStore.openConfirm({
    id: 'delete-tx-confirm',
    title: '刪除記帳紀錄',
    message: `確定要刪除這筆 ${formatCurrency(tx.amount)} 紀錄嗎？刪除後無法復原。`,
    confirmText: '確定刪除',
    isDanger: true,
    onConfirm: async () => {
      await deleteRecord(STORES.TRANSACTIONS, tx.id);
      overlayStore.closeTxModal();
      await ledgerStore.refreshData();
    }
  });
}

async function handleSubmit() {
  try {
    await saveTransactionRecord(form, localEditingTx.value);
    overlayStore.closeTxModal();
    await ledgerStore.refreshData();
  } catch (err) {
    errorMsg.value = err.message;
  }
}
</script>

<template>
  <BaseBottomSheet :open="overlayStore.txModal.open" :title="isEdit ? '編輯紀錄' : '新增紀錄'" @close="overlayStore.closeTxModal()">
    <BaseSegmented v-model="form.type" :options="txTypeOptions" class="mb-4" />

    <form @submit.prevent="handleSubmit" class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model="form.amount" @input="onAmountInput" label="總金額 (整數元)" type="number" step="1" min="1" placeholder="0" bold required />
        <FormDatePicker v-model="form.date" label="日期" />
      </div>

      <SplitAmountBox
        v-if="!isTransfer && !isRepayment"
        :type="form.type"
        :totalAmount="form.amount"
        v-model:hasSplit="form.hasSplit"
        v-model:myAmount="form.myAmount"
        v-model:otherAmount="form.otherAmount"
      />

      <div v-if="isRepayment" class="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
        <FormSelect v-model="form.repayTargetId" :options="advanceOptions" label="指定要沖銷的代墊紀錄" placeholder="請選擇一筆代墊紀錄" />
        <div class="text-[11px] text-slate-500 leading-relaxed">
          還款預設不計入一般收入，會直接扣抵該筆代墊在統計中的支出；若還款超過欠款，多出的金額會自動歸入「溢出還款」。
        </div>
      </div>

      <BaseInput v-model="form.name" label="項目名稱" :placeholder="isTransfer ? '例如：繳信用卡費、ATM 提款' : isRepayment ? '例如：朋友還聚餐費' : '選填，未填則顯示類別名稱'" />

      <div v-if="isTransfer" class="grid grid-cols-2 gap-3">
        <FormSelect v-model="form.accountId" :options="fromAccountOptions" label="轉出帳戶 (不含信用卡)" />
        <FormSelect v-model="form.toAccountId" :options="toAccountOptions" label="轉入帳戶 (可還信用卡)" />
      </div>
      <FormSelect v-else v-model="form.accountId" :options="fromAccountOptions" :label="isRepayment ? '收款帳戶 (不含信用卡)' : `所屬帳戶${form.type === 'income' ? ' (信用卡不可存入收入)' : ''}`" />

      <CategoryPickerGrid v-if="!isTransfer" v-model="form.categoryId" :categories="availableCategories" />
      <BaseInput v-model="form.note" label="備註" placeholder="選填備註..." />

      <label v-if="!isTransfer && !isRepayment" class="flex items-center space-x-2 pt-1 cursor-pointer">
        <input v-model="form.excludeFromStats" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-slate-900" />
        <span class="text-xs text-slate-700">此筆紀錄排除於統計圖表之外</span>
      </label>

      <button
        v-if="currentEditAdvanceInfo?.remainingOwed > 0 && form.type === 'expense'"
        type="button"
        @click="switchToQuickRepay"
        class="w-full py-2 px-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold rounded-md active:bg-teal-100"
      >
        ＋ 針對此筆代墊記一筆「還款」收入 (尚欠 {{ formatCurrency(currentEditAdvanceInfo.remainingOwed) }})
      </button>

      <FormSubmitBar :isEdit="isEdit" :error="errorMsg" submitText="儲存紀錄" @delete="handleDelete" />
    </form>
  </BaseBottomSheet>
</template>
