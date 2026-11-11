<script setup>
import { formatCurrency } from '../../../domain/formatCurrency.js';

defineProps({
  summary: { type: Object, required: true }
});
</script>

<template>
  <header>
    <h1 class="text-lg font-bold text-slate-900 mb-3">收支明細</h1>
    <div class="bg-white border border-slate-200 rounded-md overflow-hidden">
      <div class="p-3 grid grid-cols-4 divide-x divide-slate-200 text-center">
        <div class="px-1">
          <div class="text-[11px] text-slate-500 mb-1">本月收入</div>
          <div class="text-xs font-bold text-emerald-600 truncate">{{ formatCurrency(summary.monthIncome) }}</div>
        </div>
        <div class="px-1">
          <div class="text-[11px] text-slate-500 mb-1">本月支出</div>
          <div class="text-xs font-bold text-rose-600 truncate">{{ formatCurrency(summary.monthExpense) }}</div>
        </div>
        <div class="px-1">
          <div class="text-[11px] text-slate-500 mb-1">負債</div>
          <div class="text-xs font-bold text-amber-700 truncate">{{ formatCurrency(summary.creditDebt) }}</div>
        </div>
        <div class="px-1">
          <div class="text-[11px] text-slate-500 mb-1">本月結餘</div>
          <div class="text-xs font-bold text-slate-900 truncate">{{ formatCurrency(summary.balance) }}</div>
        </div>
      </div>
      <div class="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
        <span class="text-slate-600 font-medium">應收帳款（幫人代墊待收回）</span>
        <span :class="['font-bold', summary.totalReceivable > 0 ? 'text-amber-700' : 'text-slate-400']">
          {{ formatCurrency(summary.totalReceivable) }}
        </span>
      </div>
    </div>
  </header>
</template>
