<script setup>
import { computed } from 'vue';
import { PRESET_ICONS } from '../../config/presetIcons.js';

const props = defineProps({
  name: { type: String, default: 'tag' },
  className: { type: String, default: 'w-5 h-5' }
});

const svgContent = computed(() => PRESET_ICONS[props.name] || PRESET_ICONS.tag);
</script>

<template>
  <span
    :class="['inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full', className]"
    v-html="svgContent"
  ></span>
</template>
