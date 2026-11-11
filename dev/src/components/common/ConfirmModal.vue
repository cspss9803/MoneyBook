<script setup>
import { useOverlayStore } from '../../stores/useOverlayStore.js';

const overlayStore = useOverlayStore();
const state = overlayStore.confirmModal;

function handleCancel() {
  overlayStore.closeConfirm();
  if (typeof state.onCancel === 'function') state.onCancel();
}

async function handleConfirm() {
  overlayStore.closeConfirm();
  if (typeof state.onConfirm === 'function') await state.onConfirm();
}

function handleBackdropClick(e) {
  if (e.target === e.currentTarget && !state.lockBack) handleCancel();
}
</script>

<template>
  <Teleport to="#modal-root">
    <div
      v-if="state.open"
      @click="handleBackdropClick"
      class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white w-full max-w-xs rounded-lg border border-slate-200 p-4 shadow-sm">
        <h3 class="text-sm font-bold text-slate-900 mb-1.5">{{ state.title }}</h3>
        <p class="text-xs text-slate-600 leading-relaxed mb-4">{{ state.message }}</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            @click="handleCancel"
            class="py-2 px-3 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 bg-white active:bg-slate-100"
          >
            {{ state.cancelText }}
          </button>
          <button
            type="button"
            @click="handleConfirm"
            :class="[
              'py-2 px-3 rounded-md text-xs font-semibold text-white',
              state.isDanger ? 'bg-rose-600 active:bg-rose-700' : 'bg-slate-900 active:bg-slate-700'
            ]"
          >
            {{ state.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
