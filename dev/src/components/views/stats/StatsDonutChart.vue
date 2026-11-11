<script setup>
import { computed } from 'vue';
import { formatCurrency } from '../../../domain/formatCurrency.js';

const props = defineProps({
  items: { type: Array, default: () => [] },
  totalAmount: { type: Number, default: 0 }
});

const segments = computed(() => {
  if (!props.items.length || props.totalAmount <= 0) return [];
  let cumulativePercent = 0;
  return props.items.map((item) => {
    const pct = (item.amount / props.totalAmount) * 100;
    const dashArray = `${pct} ${100 - pct}`;
    const dashOffset = 25 - cumulativePercent;
    cumulativePercent += pct;
    return { categoryId: item.categoryId, color: item.color, dashArray, dashOffset };
  });
});

const topBars = computed(() =>
  props.items.slice(0, 6).map((item) => ({
    ...item,
    widthPct: Math.max(2, Math.min(100, item.percentage))
  }))
);
</script>

<template>
  <div v-if="!items.length || totalAmount <= 0" class="py-10 text-center text-sm text-slate-400">
    所選區間與篩選條件下無統計資料
  </div>

  <div v-else class="grid grid-cols-1 gap-4 items-center">
    <div class="relative w-44 h-44 mx-auto">
      <svg viewBox="0 0 42 42" class="w-full h-full">
        <circle cx="21" cy="21" r="15.9154943" fill="transparent" style="stroke: var(--chart-track)" stroke-width="5.5" />
        <circle
          v-for="seg in segments"
          :key="seg.categoryId"
          cx="21"
          cy="21"
          r="15.9154943"
          fill="transparent"
          :stroke="seg.color"
          stroke-width="5.5"
          :stroke-dasharray="seg.dashArray"
          :stroke-dashoffset="seg.dashOffset"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span class="text-[11px] text-slate-400">總計金額</span>
        <span class="text-sm font-bold text-slate-900 truncate max-w-full">{{ formatCurrency(totalAmount) }}</span>
      </div>
    </div>

    <div class="space-y-2.5 pt-2 border-t border-slate-100">
      <div v-for="bar in topBars" :key="bar.categoryId" class="space-y-1">
        <div class="flex justify-between text-xs">
          <span class="font-medium text-slate-700 truncate">{{ bar.name }}</span>
          <span class="text-slate-500">{{ bar.percentage }}%</span>
        </div>
        <div class="w-full h-2 bg-slate-100 rounded-sm overflow-hidden">
          <div class="h-full" :style="{ width: `${bar.widthPct}%`, backgroundColor: bar.color }"></div>
        </div>
      </div>
    </div>
  </div>
</template>
