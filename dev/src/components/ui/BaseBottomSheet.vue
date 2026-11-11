<script setup>
import AppIcon from '../common/AppIcon.vue';

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  maxHeight: { type: String, default: 'max-h-[90vh]' }
});

const emit = defineEmits(['close']);
</script>

<template>
  <Teleport to="#modal-root">
    <div
      v-if="open"
      @click.self="emit('close')"
      class="fixed inset-0 bg-slate-900/40 z-30 flex items-end justify-center"
    >
      <div :class="['bg-white w-full max-w-md rounded-t-xl border-t border-slate-200 p-4 overflow-y-auto', maxHeight]">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
          <div class="flex items-center space-x-2 min-w-0">
            <h2 class="text-base font-bold text-slate-900 truncate">{{ title }}</h2>
            <slot name="title-actions" />
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="p-1.5 text-slate-400 hover:text-slate-700 rounded-md active:bg-slate-100"
          >
            <AppIcon name="x" className="w-5 h-5" />
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
