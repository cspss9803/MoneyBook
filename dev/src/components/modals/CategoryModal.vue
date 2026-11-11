<script setup>
import { reactive, computed, watch } from 'vue';
import { STORES } from '../../config/constants.js';
import { PRESET_COLORS } from '../../config/presetColors.js';
import { addRecord } from '../../db/addRecord.js';
import { updateRecord } from '../../db/updateRecord.js';
import { deleteRecord } from '../../db/deleteRecord.js';
import { useLedgerStore } from '../../stores/useLedgerStore.js';
import { useOverlayStore } from '../../stores/useOverlayStore.js';
import AppIcon from '../common/AppIcon.vue';
import BaseBottomSheet from '../ui/BaseBottomSheet.vue';
import BaseInput from '../ui/BaseInput.vue';
import FormSelect from '../ui/FormSelect.vue';
import FormSubmitBar from '../ui/FormSubmitBar.vue';
import IconPickerGrid from '../ui/IconPickerGrid.vue';

const ledgerStore = useLedgerStore();
const overlayStore = useOverlayStore();
const modalState = overlayStore.categoryModal;
const isEdit = computed(() => Boolean(modalState.editingCategory));

const form = reactive({ type: 'expense', name: '', color: PRESET_COLORS[0], iconData: 'tag' });

watch(() => modalState.open, (isOpen) => {
  if (!isOpen) return;
  const cat = modalState.editingCategory;
  Object.assign(form, {
    type: cat?.type || modalState.defaultType || 'expense',
    name: cat?.name || '',
    color: cat?.color || PRESET_COLORS[0],
    iconData: cat?.iconData || 'tag'
  });
});

function handleDelete() {
  const cat = modalState.editingCategory;
  overlayStore.openConfirm({
    id: 'delete-cat-confirm',
    title: '刪除類別',
    message: `確定要刪除「${cat.name}」類別嗎？刪除後無法復原。`,
    confirmText: '確定刪除',
    isDanger: true,
    onConfirm: async () => {
      await deleteRecord(STORES.CATEGORIES, cat.id);
      overlayStore.closeCategoryModal();
      await ledgerStore.refreshData();
    }
  });
}

async function handleSubmit() {
  const cat = modalState.editingCategory;
  const record = { id: cat?.id || `cat_${Date.now()}`, ...form, name: form.name.trim(), iconType: 'preset', createdAt: cat?.createdAt || Date.now() };
  if (isEdit.value) await updateRecord(STORES.CATEGORIES, record);
  else await addRecord(STORES.CATEGORIES, record);
  overlayStore.closeCategoryModal();
  await ledgerStore.refreshData();
}
</script>

<template>
  <BaseBottomSheet :open="modalState.open" :title="isEdit ? '編輯類別' : '新增類別'" @close="overlayStore.closeCategoryModal()">
    <form @submit.prevent="handleSubmit" class="space-y-3">
      <div class="grid grid-cols-3 gap-3">
        <FormSelect v-model="form.type" label="類型" :options="[{ value: 'expense', label: '支出' }, { value: 'income', label: '收入' }]" />
        <BaseInput v-model="form.name" class="col-span-2" label="類別名稱" required placeholder="例如：早餐、股息" />
      </div>

      <div class="flex items-center space-x-3 p-2.5 bg-slate-50 border border-slate-200 rounded-md">
        <div class="w-9 h-9 rounded flex items-center justify-center text-white" :style="{ backgroundColor: form.color }"><AppIcon :name="form.iconData" /></div>
        <div class="text-xs"><div class="font-semibold">{{ form.name || '類別預覽' }}</div><div class="text-slate-500">色碼：{{ form.color }}</div></div>
      </div>

      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">代表顏色</label>
        <div class="grid grid-cols-7 gap-2 p-2.5 border border-slate-200 rounded-md bg-slate-50">
          <button v-for="hex in PRESET_COLORS" :key="hex" type="button" @click="form.color = hex" :class="['w-7 h-7 rounded-full mx-auto border-2', form.color.toLowerCase() === hex.toLowerCase() ? 'border-slate-900 scale-110' : 'border-transparent']" :style="{ backgroundColor: hex }"></button>
        </div>
      </div>

      <IconPickerGrid v-model="form.iconData" label="代表圖案" />
      <FormSubmitBar :isEdit="isEdit" submitText="儲存類別" @delete="handleDelete" />
    </form>
  </BaseBottomSheet>
</template>
