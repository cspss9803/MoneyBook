<script setup>
import AppIcon from '../common/AppIcon.vue';

defineProps({
  modelValue: { type: String, default: '' },
  categories: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div>
    <label class="block text-xs font-medium text-slate-600 mb-1">選擇類別</label>
    <div class="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 rounded-md bg-slate-50">
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        @click="emit('update:modelValue', cat.id)"
        :class="[
          'p-2 rounded border flex flex-col items-center justify-center space-y-1',
          cat.id === modelValue ? 'bg-white border-slate-900 font-semibold' : 'border-transparent text-slate-600'
        ]"
      >
        <span class="w-7 h-7 rounded flex items-center justify-center text-white" :style="{ backgroundColor: cat.color }">
          <AppIcon :name="cat.iconData" className="w-4 h-4" />
        </span>
        <span class="text-[11px] truncate w-full text-center">{{ cat.name }}</span>
      </button>
    </div>
  </div>
</template>
