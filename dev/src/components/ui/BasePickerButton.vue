<script setup>
import AppIcon from '../common/AppIcon.vue';

defineProps({
  label: { type: String, default: '' },
  text: { type: String, default: '' },
  placeholder: { type: String, default: '請選擇' },
  icon: { type: String, default: '' },
  trailing: { type: String, default: 'chevron' }
});

const emit = defineEmits(['click']);
</script>

<template>
  <div>
    <label v-if="label" class="block text-xs font-medium text-slate-600 mb-1">{{ label }}</label>
    <button
      type="button"
      @click="emit('click')"
      class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm flex items-center justify-between active:bg-slate-50"
    >
      <span v-if="text" class="flex items-center space-x-2 min-w-0 text-slate-900 font-medium">
        <AppIcon v-if="icon" :name="icon" className="w-4 h-4 text-slate-600 shrink-0" />
        <span class="truncate">{{ text }}</span>
      </span>
      <span v-else class="text-slate-400 truncate">{{ placeholder }}</span>

      <svg v-if="trailing === 'calendar'" class="w-4 h-4 text-slate-400 shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
      </svg>
      <svg v-else class="w-4 h-4 text-slate-400 shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  </div>
</template>
