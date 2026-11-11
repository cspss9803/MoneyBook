<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  step: { type: [String, Number], default: undefined },
  min: { type: [String, Number], default: undefined },
  max: { type: [String, Number], default: undefined },
  required: { type: Boolean, default: false },
  bold: { type: Boolean, default: false },
  uppercase: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'input']);

function onInput(e) {
  emit('update:modelValue', e.target.value);
  emit('input', e);
}
</script>

<template>
  <div>
    <label v-if="label" class="block text-xs font-medium text-slate-600 mb-1">{{ label }}</label>
    <input
      :value="modelValue"
      @input="onInput"
      :type="type"
      :step="step"
      :min="min"
      :max="max"
      :required="required"
      :placeholder="placeholder"
      :class="[
        'w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900',
        bold ? 'font-semibold' : '',
        uppercase ? 'uppercase' : ''
      ]"
    />
  </div>
</template>
