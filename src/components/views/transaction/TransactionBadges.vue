<script setup>
import { formatCurrency } from '../../../domain/formatCurrency.js';
import BaseBadge from '../../ui/BaseBadge.vue';

defineProps({
  tx: { type: Object, required: true },
  isFuture: { type: Boolean, default: false },
  advInfo: { type: Object, default: null },
  overflowAmt: { type: Number, default: 0 },
  repayTargetName: { type: String, default: '' }
});
</script>

<template>
  <template v-if="tx.type === 'expense' && advInfo">
    <BaseBadge v-if="advInfo.remainingOwed > 0" variant="amber">待收 {{ formatCurrency(advInfo.remainingOwed) }}</BaseBadge>
    <BaseBadge v-else variant="emerald">已收齊</BaseBadge>
  </template>
  <BaseBadge v-else-if="tx.type === 'income' && tx.categoryId === 'cat_sys_repayment'" variant="teal">
    沖銷：{{ repayTargetName }}{{ overflowAmt > 0 ? ` (溢出 +${formatCurrency(overflowAmt)})` : '' }}
  </BaseBadge>
  <BaseBadge v-else-if="tx.type === 'income' && tx.otherAmount >= 1">
    自留 {{ formatCurrency(tx.myAmount) }}
  </BaseBadge>
  <BaseBadge v-if="isFuture">預記</BaseBadge>
  <BaseBadge v-if="tx.excludeFromStats && tx.type !== 'transfer'">不計統計</BaseBadge>
</template>
