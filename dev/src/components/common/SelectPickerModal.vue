<script setup>
import { useOverlayStore } from '../../stores/useOverlayStore.js';
import AppIcon from './AppIcon.vue';
import BaseBottomSheet from '../ui/BaseBottomSheet.vue';

const overlayStore = useOverlayStore();
const state = overlayStore.selectPicker;

function handleSelect(val) {
  overlayStore.closeSelectPicker();
  if (typeof state.onSelect === 'function') state.onSelect(val);
}
</script>

<template>
  <BaseBottomSheet
    :open="state.open"
    :title="state.title"
    maxHeight="max-h-[75vh]"
    @close="overlayStore.closeSelectPicker()"
  >
    <div class="space-y-2">
      <div v-if="state.options.length === 0" class="py-6 text-center text-xs text-slate-400">無可用選項</div>

      <button
        v-for="opt in state.options"
        :key="opt.value"
        type="button"
        @click="handleSelect(opt.value)"
        :class="[
          'w-full p-3 rounded-md border flex items-center justify-between text-left transition-colors',
          String(opt.value) === String(state.selectedValue)
            ? 'bg-slate-50 border-slate-900 font-semibold text-slate-900'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100'
        ]"
      >
        <div class="flex items-center space-x-3 min-w-0">
          <span
            v-if="opt.icon"
            class="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0"
          >
            <AppIcon :name="opt.icon" className="w-4 h-4" />
          </span>
          <div class="min-w-0">
            <div class="truncate text-sm">{{ opt.label }}</div>
            <div v-if="opt.subLabel" class="text-xs text-slate-400 truncate mt-0.5">{{ opt.subLabel }}</div>
          </div>
        </div>

        <span v-if="String(opt.value) === String(state.selectedValue)" class="text-slate-900 shrink-0 ml-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      </button>
    </div>
  </BaseBottomSheet>
</template>
