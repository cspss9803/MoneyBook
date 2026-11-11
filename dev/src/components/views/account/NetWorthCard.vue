<script setup>
import { formatCurrency } from '../../../domain/formatCurrency.js';

defineProps({
  netWorth: { type: Number, default: 0 },
  totalAssets: { type: Number, default: 0 },
  totalLiabilities: { type: Number, default: 0 }
});
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-md p-3">
    <div class="text-xs text-slate-500 mb-1">淨資產（含股票最新現值）</div>
    <div class="text-xl font-bold text-slate-900 mb-3">{{ formatCurrency(netWorth) }}</div>
    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
      <div>
        <span class="text-slate-500">總資產：</span>
        <span class="font-semibold text-emerald-600">{{ formatCurrency(totalAssets) }}</span>
      </div>
      <div>
        <span class="text-slate-500">總負債：</span>
        <span class="font-semibold text-rose-600">{{ formatCurrency(totalLiabilities) }}</span>
      </div>
    </div>
  </div>
</template>
