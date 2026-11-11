<script setup>
const props = defineProps({
  type: { type: String, required: true },
  totalAmount: { type: [Number, String], default: '' },
  hasSplit: { type: Boolean, default: false },
  myAmount: { type: [Number, String], default: '' },
  otherAmount: { type: [Number, String], default: '' }
});

const emit = defineEmits(['update:hasSplit', 'update:myAmount', 'update:otherAmount']);

function toggleSplit(e) {
  const checked = e.target.checked;
  emit('update:hasSplit', checked);
  const total = Math.max(0, Math.round(Number(props.totalAmount) || 0));
  if (checked) {
    const other = Math.min(total, Math.max(0, Math.round(Number(props.otherAmount) || 0)));
    emit('update:otherAmount', other || '');
    emit('update:myAmount', Math.max(0, total - other));
  } else {
    emit('update:otherAmount', '');
    emit('update:myAmount', props.totalAmount);
  }
}

function onMyAmountInput(e) {
  const total = Math.max(0, Math.round(Number(props.totalAmount) || 0));
  const my = Math.min(total, Math.max(0, Math.round(Number(e.target.value) || 0)));
  emit('update:myAmount', my);
  emit('update:otherAmount', Math.max(0, total - my));
}

function onOtherAmountInput(e) {
  const total = Math.max(0, Math.round(Number(props.totalAmount) || 0));
  const other = Math.min(total, Math.max(0, Math.round(Number(e.target.value) || 0)));
  emit('update:otherAmount', other);
  emit('update:myAmount', Math.max(0, total - other));
}
</script>

<template>
  <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
    <label class="flex items-center justify-between cursor-pointer">
      <span class="text-xs font-medium text-slate-700">
        {{ type === 'expense' ? '此筆支出含幫人代墊（劃分個人與他人金額）' : '此筆收入含他人份額（劃分個人與他人金額）' }}
      </span>
      <input type="checkbox" :checked="hasSplit" @change="toggleSplit" class="w-4 h-4 rounded border-slate-300 text-slate-900" />
    </label>

    <template v-if="hasSplit">
      <div class="grid grid-cols-2 gap-2 pt-1">
        <div>
          <label class="block text-[11px] text-slate-500 mb-1">屬於自己 (元)</label>
          <input type="number" step="1" min="0" placeholder="0" :value="myAmount" @input="onMyAmountInput" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:border-slate-900" />
        </div>
        <div>
          <label class="block text-[11px] text-slate-500 mb-1">{{ type === 'expense' ? '幫人代墊 / 應收 (元)' : '他人份額 (元)' }}</label>
          <input type="number" step="1" min="0" placeholder="0" :value="otherAmount" @input="onOtherAmountInput" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-amber-700 focus:outline-none focus:border-slate-900" />
        </div>
      </div>
      <div class="text-[11px] text-slate-500">
        {{ type === 'expense' ? '幫人代墊滿 1 元以上會標記為「應收帳款」，待收到「還款」後將自動從支出統計中扣除。' : '統計收入時僅會計算「屬於自己」的金額，但帳戶實際入帳仍以總金額計算。' }}
      </div>
    </template>
  </div>
</template>
