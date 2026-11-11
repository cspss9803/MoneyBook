<script setup>
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import { useOverlayStore } from '../../../stores/useOverlayStore.js';
import { useMonthlySummary } from '../../../composables/useMonthlySummary.js';
import TransactionSummaryCard from './TransactionSummaryCard.vue';
import TransactionRow from './TransactionRow.vue';

const ledgerStore = useLedgerStore();
const overlayStore = useOverlayStore();
const { todayStr, txMap, allRec, summary, groupedByDate } = useMonthlySummary();

function getRepayTargetName(tx) {
  const targetTx = txMap.value.get(tx.repayTargetId);
  if (!targetTx) return '代墊';
  return targetTx.name || ledgerStore.categoryMap.get(targetTx.categoryId)?.name || '代墊';
}
</script>

<template>
  <div>
    <TransactionSummaryCard :summary="summary" class="mb-4" />

    <div v-if="groupedByDate.length === 0" class="bg-white border border-slate-200 rounded-md p-8 text-center text-sm text-slate-400">
      尚無任何記帳紀錄，請點擊下方「＋」新增。
    </div>

    <div v-for="[date, items] in groupedByDate" :key="date" class="bg-white border border-slate-200 rounded-md overflow-hidden mb-3">
      <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
        <span class="font-semibold text-slate-600">{{ date }}</span>
        <span class="text-slate-400">{{ items.length }} 筆</span>
      </div>
      <div class="divide-y divide-slate-100">
        <TransactionRow
          v-for="tx in items"
          :key="tx.id"
          :tx="tx"
          :todayStr="todayStr"
          :advInfo="allRec.advanceMap.get(tx.id)"
          :overflowAmt="allRec.repaymentOverflowMap.get(tx.id) || 0"
          :repayTargetName="getRepayTargetName(tx)"
          @click="overlayStore.openTxModal(tx)"
        />
      </div>
    </div>
  </div>
</template>
