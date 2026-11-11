<script setup>
import { formatCurrency } from '../../../domain/formatCurrency.js';
import AppIcon from '../../common/AppIcon.vue';

defineProps({
  items: { type: Array, default: () => [] }
});
</script>

<template>
  <section v-if="items.length > 0" class="bg-white border border-slate-200 rounded-md overflow-hidden">
    <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">分類統計明細</div>
    <div class="divide-y divide-slate-100">
      <div v-for="item in items" :key="item.categoryId" class="p-3 flex items-center justify-between">
        <div class="flex items-center space-x-3 min-w-0">
          <div class="w-8 h-8 rounded flex items-center justify-center text-white shrink-0" :style="{ backgroundColor: item.color }">
            <AppIcon :name="item.iconData" className="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <div class="text-sm font-medium text-slate-900 truncate">{{ item.name }}</div>
            <div class="text-xs text-slate-400">{{ item.count }} 筆 · 佔比 {{ item.percentage }}%</div>
          </div>
        </div>
        <div class="text-sm font-semibold text-slate-900 shrink-0 ml-2">{{ formatCurrency(item.amount) }}</div>
      </div>
    </div>
  </section>
</template>
