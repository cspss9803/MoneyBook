<script setup>
import { useOverlayStore } from '../../stores/useOverlayStore.js';
import BasePickerButton from './BasePickerButton.vue';

const props = defineProps({
  modelValue: { type: String, required: true },
  label: { type: String, default: '' },
  modalTitle: { type: String, default: '選擇日期' }
});

const emit = defineEmits(['update:modelValue']);
const overlayStore = useOverlayStore();

function openPicker() {
  overlayStore.openDatePicker({
    title: props.modalTitle || props.label || '選擇日期',
    selectedDateStr: props.modelValue,
    onSelect: (dateStr) => emit('update:modelValue', dateStr)
  });
}
</script>

<template>
  <BasePickerButton :label="label" :text="modelValue" trailing="calendar" @click="openPicker" />
</template>
