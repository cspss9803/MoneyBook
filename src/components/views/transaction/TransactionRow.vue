<script setup>
import { computed } from 'vue';
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import { formatCurrency } from '../../../domain/formatCurrency.js';
import AppIcon from '../../common/AppIcon.vue';
import TransactionBadges from './TransactionBadges.vue';

const props = defineProps({
  tx: { type: Object, required: true },
  todayStr: { type: String, required: true },
  advInfo: { type: Object, default: null },
  overflowAmt: { type: Number, default: 0 },
  repayTargetName: { type: String, default: '' }
});

const ledgerStore = useLedgerStore();
const cat = computed(() => ledgerStore.categoryMap.get(props.tx.categoryId));
const fromName = computed(() => ledgerStore.accountMap.get(props.tx.accountId)?.name || '未知帳戶');
const toAcc = computed(() => ledgerStore.accountMap.get(props.tx.toAccountId));

const title = computed(() => {
  if (props.tx.type === 'transfer') return props.tx.name || (toAcc.value?.type === 'credit' ? '信用卡還款' : '帳戶轉移');
  return props.tx.name || cat.value?.name || '未分類';
});

const subtitle = computed(() => {
  const base = props.tx.type === 'transfer' ? `${fromName.value} ➔ ${toAcc.value?.name || '未知帳戶'}` : `${cat.value?.name || '未分類'} · ${fromName.value}`;
  return props.tx.note ? `${base} · ${props.tx.note}` : base;
});
</script>

<template>
  <div class="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
    <div class="flex items-center space-x-3 min-w-0 flex-1">
      <div
        class="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
        :class="tx.type === 'transfer' ? 'bg-slate-100 border border-slate-200 text-slate-600' : 'text-white'"
        :style="tx.type !== 'transfer' ? { backgroundColor: cat?.color || '#64748b' } : {}"
      >
        <AppIcon :name="tx.type === 'transfer' ? 'arrowRight' : (cat?.iconData || 'tag')" :className="tx.type === 'transfer' ? 'w-4 h-4' : 'w-5 h-5'" />
      </div>
      <div class="min-w-0 flex-1 overflow-hidden">
        <div class="flex items-center flex-wrap gap-1 min-w-0">
          <span class="text-sm font-medium text-slate-900 truncate max-w-full">{{ title }}</span>
          <TransactionBadges :tx="tx" :isFuture="tx.date > todayStr" :advInfo="advInfo" :overflowAmt="overflowAmt" :repayTargetName="repayTargetName" />
        </div>
        <div class="text-xs text-slate-500 truncate">{{ subtitle }}</div>
      </div>
    </div>

    <div class="text-right shrink-0 ml-2">
      <div :class="['text-sm font-semibold', tx.type === 'transfer' ? 'text-slate-700' : tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600']">
        {{ tx.type === 'transfer' ? '' : tx.type === 'expense' ? '-' : '+' }}{{ formatCurrency(tx.amount) }}
      </div>
      <div v-if="tx.type === 'expense' && advInfo?.repaidAmount > 0" class="text-[10px] text-slate-400">
        實支 {{ formatCurrency(advInfo.effectiveExpense) }}
      </div>
    </div>
  </div>
</template>