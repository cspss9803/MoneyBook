<script setup>
import { useLedgerStore } from '../../stores/useLedgerStore.js';
import { useOverlayStore } from '../../stores/useOverlayStore.js';

const ledgerStore = useLedgerStore();
const overlayStore = useOverlayStore();

const tabs = [
  {
    id: 'transactions',
    label: '明細',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>'
  },
  {
    id: 'accounts',
    label: '帳戶',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>'
  },
  { id: 'add', isAction: true },
  {
    id: 'stats',
    label: '統計',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>'
  },
  {
    id: 'settings',
    label: '設定',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  }
];
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 h-16 grid grid-cols-5 items-center z-20">
    <template v-for="tab in tabs" :key="tab.id">
      <button
        v-if="tab.isAction"
        type="button"
        @click="overlayStore.openTxModal(null)"
        class="mx-auto w-12 h-10 bg-slate-900 text-white rounded-md flex items-center justify-center active:bg-slate-700"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <button
        v-else
        type="button"
        @click="ledgerStore.currentTab = tab.id"
        :class="[
          'flex flex-col items-center justify-center h-full space-y-1',
          ledgerStore.currentTab === tab.id ? 'text-slate-900 font-semibold' : 'text-slate-400 font-normal'
        ]"
      >
        <span class="w-5 h-5 [&>svg]:w-full [&>svg]:h-full" v-html="tab.svg"></span>
        <span class="text-xs">{{ tab.label }}</span>
      </button>
    </template>
  </nav>
</template>
