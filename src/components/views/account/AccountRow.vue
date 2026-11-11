<script setup>
import { computed } from 'vue';
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import { formatCurrency } from '../../../domain/formatCurrency.js';
import AppIcon from '../../common/AppIcon.vue';

const props = defineProps({
  acc: { type: Object, required: true }
});

const ledgerStore = useLedgerStore();
const pnl = computed(() => props.acc.portfolio?.totalUnrealizedPnL || 0);

const subText = computed(() => {
  if (props.acc.type === 'stock') {
    const bank = ledgerStore.accountMap.get(props.acc.settlementAccountId)?.name || '未綁定交割戶';
    const disc = props.acc.portfolio?.feeDiscount < 10 ? `${props.acc.portfolio.feeDiscount}折` : '無折扣';
    return `交割：${bank} (${disc}) · 持有 ${props.acc.portfolio?.holdings.length || 0} 檔`;
  }
  return props.acc.type === 'credit' ? '信用卡（僅計消費與轉入還款）' : `初始資金 ${formatCurrency(props.acc.initialBalance)}`;
});
</script>

<template>
  <div class="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
    <div class="flex items-center space-x-3 min-w-0">
      <div class="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
        <AppIcon :name="acc.iconData" className="w-5 h-5" />
      </div>
      <div class="min-w-0">
        <div class="text-sm font-medium text-slate-900 truncate">{{ acc.name }}</div>
        <div class="text-xs text-slate-400 truncate">{{ subText }}</div>
      </div>
    </div>

    <div v-if="acc.type === 'stock'" class="text-right shrink-0 ml-2">
      <div class="text-sm font-semibold text-slate-900">{{ formatCurrency(acc.balance) }}</div>
      <div :class="['text-[11px] font-medium', pnl > 0 ? 'text-emerald-600' : pnl < 0 ? 'text-rose-600' : 'text-slate-400']">
        損益 {{ pnl > 0 ? '+' : '' }}{{ formatCurrency(pnl) }}
      </div>
    </div>
    <div v-else :class="['text-sm font-semibold shrink-0 ml-2', acc.balance < 0 ? 'text-rose-600' : 'text-slate-900']">
      {{ formatCurrency(acc.balance) }}
    </div>
  </div>
</template>
