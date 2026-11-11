<script setup>
import { computed } from 'vue';
import { useOverlayStore } from '../../stores/useOverlayStore.js';
import BasePickerButton from './BasePickerButton.vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '請選擇' },
  modalTitle: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'change']);
const overlayStore = useOverlayStore();

const selectedOption = computed(() =>
  props.options.find((opt) => String(opt.value) === String(props.modelValue))
);

function openPicker() {
  overlayStore.openSelectPicker({
    title: props.modalTitle || props.label || '請選擇',
    selectedValue: props.modelValue,
    options: props.options,
    onSelect: (val) => {
      emit('update:modelValue', val);
      emit('change', val);
    }
  });
}
</script>

<template>
  <BasePickerButton
    :label="label"
    :text="selectedOption?.label || ''"
    :icon="selectedOption?.icon || ''"
    :placeholder="placeholder"
    @click="openPicker"
  />
</template>
