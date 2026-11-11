<script setup>
defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, required: true },
  size: { type: String, default: 'md' }
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div v-if="size === 'sm'" class="inline-flex bg-slate-200 p-0.5 rounded-md">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      @click="emit('update:modelValue', opt.value)"
      :class="[
        'px-3 py-1 text-xs font-semibold rounded transition-colors',
        modelValue === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
      ]"
    >
      {{ opt.label }}
    </button>
  </div>

  <div
    v-else
    :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }"
    class="grid gap-1 bg-slate-100 p-1 rounded-md border border-slate-200"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      @click="emit('update:modelValue', opt.value)"
      :class="[
        'py-1.5 text-xs font-semibold rounded transition-colors',
        modelValue === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
      ]"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
