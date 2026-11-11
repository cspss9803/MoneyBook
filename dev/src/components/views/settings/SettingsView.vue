<script setup>
import { computed } from 'vue';
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import { useOverlayStore } from '../../../stores/useOverlayStore.js';
import { useTheme } from '../../../composables/useTheme.js';
import AppIcon from '../../common/AppIcon.vue';
import BaseSegmented from '../../ui/BaseSegmented.vue';
import BaseBadge from '../../ui/BaseBadge.vue';
import BackupSection from './BackupSection.vue';

const ledgerStore = useLedgerStore();
const overlayStore = useOverlayStore();
const { currentTheme, applyTheme } = useTheme();

const categories = computed(() =>
  ledgerStore.categories.filter((c) => c.type === ledgerStore.settingsCategoryType)
);
const isSys = (cat) => Boolean(cat.isSystem || cat.id?.startsWith('cat_sys_'));
</script>

<template>
  <div>
    <header class="mb-4"><h1 class="text-lg font-bold text-slate-900">設定與管理</h1></header>

    <section class="bg-white border border-slate-200 rounded-md p-3 mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-sm font-bold text-slate-900">外觀主題</h2>
        <p class="text-xs text-slate-500">切換淺色或深色護眼介面</p>
      </div>
      <BaseSegmented size="sm" :modelValue="currentTheme" @update:modelValue="applyTheme" :options="[{ label: '淺色', value: 'light' }, { label: '深色', value: 'dark' }]" />
    </section>

    <section class="bg-white border border-slate-200 rounded-md overflow-hidden mb-4">
      <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <BaseSegmented size="sm" v-model="ledgerStore.settingsCategoryType" :options="[{ label: '支出類別', value: 'expense' }, { label: '收入類別', value: 'income' }]" />
        <button type="button" @click="overlayStore.openCategoryModal(null, ledgerStore.settingsCategoryType)" class="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md active:bg-slate-700">
          ＋ 新增類別
        </button>
      </div>
      <div class="divide-y divide-slate-100">
        <div v-for="cat in categories" :key="cat.id" @click="!isSys(cat) && overlayStore.openCategoryModal(cat, ledgerStore.settingsCategoryType)" :class="['p-3 flex items-center justify-between', !isSys(cat) ? 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer' : '']">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded flex items-center justify-center text-white" :style="{ backgroundColor: cat.color }">
              <AppIcon :name="cat.iconData" className="w-4 h-4" />
            </div>
            <span class="text-sm font-medium text-slate-900">{{ cat.name }}</span>
            <BaseBadge v-if="isSys(cat)">系統專用</BaseBadge>
          </div>
          <AppIcon v-if="!isSys(cat)" name="pencil" className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </section>

    <BackupSection />
  </div>
</template>
