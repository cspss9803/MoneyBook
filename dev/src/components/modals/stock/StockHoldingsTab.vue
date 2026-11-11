<script setup>
import { formatCurrency } from '../../../domain/formatCurrency.js';

defineProps({
  portfolio: { type: Object, required: true }
});
</script>

<template>
  <div v-if="portfolio.holdings.length === 0" class="py-10 text-center text-xs text-slate-400">
    目前無持有庫存，請切換至「買賣記錄」新增買入。
  </div>

  <div v-else class="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden bg-white">
    <div v-for="h in portfolio.holdings" :key="h.symbol" class="p-3 flex items-center justify-between">
      <div>
        <div class="flex items-center space-x-1.5">
          <span class="text-sm font-bold text-slate-900">{{ h.symbol }}</span>
          <span class="text-xs px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600">
            {{ h.shares.toLocaleString() }} 股 ({{ h.lotCount }} 筆)
          </span>
        </div>
        <div class="text-xs text-slate-500 mt-1">
          均價 {{ h.avgCost }} · 收盤 {{ h.currentPrice }}
          <span class="text-[10px] text-slate-400">({{ h.priceDate }})</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">
          總成本 {{ formatCurrency(h.totalCost) }}
          <template v-if="portfolio.deductSellFee">
            · 預扣手續費 ${{ h.estimatedSellFee }} / 稅 ${{ h.estimatedSellTax }}
          </template>
        </div>
      </div>

      <div class="text-right">
        <div class="text-sm font-bold text-slate-900">{{ formatCurrency(h.marketValue) }}</div>
        <div :class="['text-xs font-semibold', h.unrealizedPnL > 0 ? 'text-emerald-600' : h.unrealizedPnL < 0 ? 'text-rose-600' : 'text-slate-500']">
          {{ h.unrealizedPnL > 0 ? '+' : '' }}{{ formatCurrency(h.unrealizedPnL) }} ({{ h.unrealizedPnL > 0 ? '+' : '' }}{{ h.returnRate }}%)
        </div>
      </div>
    </div>
  </div>
</template>
