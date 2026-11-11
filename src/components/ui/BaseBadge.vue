<script setup>
const props = defineProps({
  variant: { type: String, default: 'neutral' }
});

const variantMap = {
  neutral: 'bg-slate-100 border-slate-200 text-slate-500',
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  teal: 'bg-teal-50 border-teal-200 text-teal-800',
  rose: 'bg-rose-50 border-rose-200 text-rose-600'
};
</script>

<template>
  <span :class="['text-[10px] px-1.5 py-0.5 border rounded shrink-0', variantMap[props.variant] || variantMap.neutral]">
    <slot />
  </span>
</template>
