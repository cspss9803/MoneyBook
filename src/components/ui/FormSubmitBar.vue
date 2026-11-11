<script setup>
defineProps({
  isEdit: { type: Boolean, default: false },
  error: { type: String, default: '' },
  submitText: { type: String, default: '儲存' }
});

const emit = defineEmits(['delete']);
</script>

<template>
  <div v-if="error" class="text-xs text-rose-600">{{ error }}</div>
  <div class="pt-2 flex items-center space-x-2">
    <button
      v-if="isEdit"
      type="button"
      @click="emit('delete')"
      class="px-4 py-2.5 border border-rose-200 text-rose-600 text-sm font-semibold rounded-md active:bg-rose-50"
    >
      刪除
    </button>
    <button
      type="submit"
      class="flex-1 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-md active:bg-slate-700"
    >
      {{ submitText }}
    </button>
  </div>
</template>
