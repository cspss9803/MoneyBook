<script setup>
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import { useOverlayStore } from '../../../stores/useOverlayStore.js';
import { usePortfolioSummary } from '../../../composables/usePortfolioSummary.js';
import { formatCurrency } from '../../../domain/formatCurrency.js';
import NetWorthCard from './NetWorthCard.vue';
import AccountRow from './AccountRow.vue';

const ledgerStore = useLedgerStore();
const overlayStore = useOverlayStore();
const summary = usePortfolioSummary();

function openAccount(acc) {
  const raw = ledgerStore.accounts.find((a) => a.id === acc.id);
  if (!raw) return;
  if (raw.type === 'stock') overlayStore.openStockModal(raw);
  else overlayStore.openAccountModal(raw);
}
</script>

<template>
  <div>
    <header class="mb-4">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-lg font-bold text-slate-900">帳戶總覽</h1>
        <button type="button" @click="overlayStore.openAccountModal(null)" class="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md active:bg-slate-700">
          ＋ 新增帳戶
        </button>
      </div>
      <NetWorthCard :netWorth="summary.netWorth" :totalAssets="summary.totalAssets" :totalLiabilities="summary.totalLiabilities" />
    </header>

    <div v-if="summary.groups.length === 0" class="bg-white border border-slate-200 rounded-md p-8 text-center text-sm text-slate-400">
      尚無帳戶，請點擊右上角新增。
    </div>

    <div v-for="g in summary.groups" :key="g.id" class="bg-white border border-slate-200 rounded-md overflow-hidden mb-3">
      <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
        <span class="font-semibold text-slate-600">{{ g.label }}</span>
        <span class="font-medium text-slate-500">{{ formatCurrency(g.groupTotal) }}</span>
      </div>
      <div class="divide-y divide-slate-100">
        <AccountRow v-for="acc in g.items" :key="acc.id" :acc="acc" @click="openAccount(acc)" />
      </div>
    </div>
  </div>
</template>
