<script setup>
import { computed } from 'vue';
import { STATS_PERIODS } from '../../../config/constants.js';
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import { filterTransactionsByDate } from '../../../domain/filterTransactionsByDate.js';
import { aggregateStatsByCategory } from '../../../domain/aggregateStatsByCategory.js';
import { calculateReceivables } from '../../../domain/calculateReceivables.js';
import { formatCurrency } from '../../../domain/formatCurrency.js';
import BaseSegmented from '../../ui/BaseSegmented.vue';
import FormDatePicker from '../../ui/FormDatePicker.vue';
import StatsDonutChart from './StatsDonutChart.vue';
import StatsRankList from './StatsRankList.vue';

const ledgerStore = useLedgerStore();
const filter = ledgerStore.statsFilter;
const todayStr = new Date().toLocaleDateString('sv-SE');

const receivablesInfo = computed(() => calculateReceivables(ledgerStore.transactions, todayStr));
const availableCategories = computed(() =>
  ledgerStore.categories.filter((c) => c.type === filter.type && c.id !== 'cat_sys_repayment')
);
const activeIds = computed(() =>
  filter.selectedCategoryIds === null ? availableCategories.value.map((c) => c.id) : filter.selectedCategoryIds
);

const statsResult = computed(() =>
  aggregateStatsByCategory(
    filterTransactionsByDate(ledgerStore.transactions, filter),
    ledgerStore.categories,
    { ...filter, selectedCategoryIds: activeIds.value },
    receivablesInfo.value
  )
);

function switchType(type) {
  filter.type = type;
  filter.selectedCategoryIds = null;
}

function toggleCat(id) {
  filter.selectedCategoryIds = activeIds.value.includes(id)
    ? activeIds.value.filter((x) => x !== id)
    : [...activeIds.value, id];
}
</script>

<template>
  <div>
    <header class="mb-4 space-y-3">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-bold text-slate-900">統計分析</h1>
        <BaseSegmented size="sm" :modelValue="filter.type" @update:modelValue="switchType" :options="[{ label: '支出', value: 'expense' }, { label: '收入', value: 'income' }]" />
      </div>

      <div class="bg-white border border-slate-200 rounded-md px-3 py-2 flex justify-between text-xs">
        <span class="text-slate-600 font-medium">目前應收帳款（幫人代墊尚未收回）</span>
        <span :class="['font-bold', receivablesInfo.totalReceivable > 0 ? 'text-amber-700' : 'text-slate-400']">{{ formatCurrency(receivablesInfo.totalReceivable) }}</span>
      </div>

      <div class="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1">
        <button v-for="p in STATS_PERIODS" :key="p.id" type="button" @click="filter.period = p.id" :class="['px-3 py-1.5 text-xs font-semibold rounded-md shrink-0 border', filter.period === p.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200']">
          {{ p.label }}
        </button>
      </div>

      <div class="bg-white border border-slate-200 rounded-md p-3">
        <div v-if="filter.period === 'custom'" class="grid grid-cols-2 gap-2">
          <FormDatePicker v-model="filter.customStart" label="起始日期" />
          <FormDatePicker v-model="filter.customEnd" label="結束日期" />
        </div>
        <FormDatePicker v-else v-model="filter.anchorDate" label="統計基準日（依此日推算所選週/月/季/年）" />
      </div>
    </header>

    <section class="bg-white border border-slate-200 rounded-md p-4 mb-3">
      <StatsDonutChart :items="statsResult.items" :totalAmount="statsResult.totalAmount" />
    </section>

    <section class="bg-white border border-slate-200 rounded-md p-3 mb-3 space-y-2.5">
      <div class="flex justify-between text-xs">
        <span class="font-semibold text-slate-700">勾選要納入統計的類別</span>
        <div class="space-x-2">
          <button type="button" @click="filter.selectedCategoryIds = null" class="text-slate-600 underline">全選</button>
          <button type="button" @click="filter.selectedCategoryIds = []" class="text-slate-600 underline">全不選</button>
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button v-for="cat in availableCategories" :key="cat.id" type="button" @click="toggleCat(cat.id)" :class="['px-2.5 py-1 rounded border text-xs flex items-center space-x-1.5', activeIds.includes(cat.id) ? 'bg-slate-900 text-white border-slate-900 font-medium' : 'bg-white text-slate-400 border-slate-200']">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: cat.color }"></span>
          <span>{{ cat.name }}</span>
        </button>
      </div>
      <label class="flex items-center space-x-2 pt-2 border-t border-slate-100 cursor-pointer">
        <input v-model="filter.includeExcluded" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-slate-900" />
        <span class="text-xs text-slate-600">將單筆標記為「不計統計」的紀錄也納入計算</span>
      </label>
    </section>

    <StatsRankList :items="statsResult.items" />
  </div>
</template>
