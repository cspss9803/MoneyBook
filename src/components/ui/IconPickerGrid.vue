<script setup>
import { PRESET_ICONS } from '../../config/presetIcons.js';
import AppIcon from '../common/AppIcon.vue';

defineProps({
  modelValue: { type: String, default: 'wallet' },
  label: { type: String, default: '選擇圖示' }
});

const emit = defineEmits(['update:modelValue']);
const iconKeys = Object.keys(PRESET_ICONS).filter((k) => k !== 'x' && k !== 'pencil' && k !== 'arrowRight');
</script>

<template>
  <div>
    <label class="block text-xs font-medium text-slate-600 mb-1">{{ label }}</label>
    <div class="grid grid-cols-5 gap-2 p-2 border border-slate-200 rounded-md bg-slate-50 max-h-40 overflow-y-auto">
      <button
        v-for="key in iconKeys"
        :key="key"
        type="button"
        @click="emit('update:modelValue', key)"
        :class="[
          'p-2 rounded border flex items-center justify-center',
          modelValue === key ? 'bg-white border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
        ]"
      >
        <AppIcon :name="key" className="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
