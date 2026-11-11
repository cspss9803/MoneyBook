<script setup>
import { formatCurrency } from '../../../domain/formatCurrency.js';
import { removeStockTradeWithSettlement } from '../../../domain/stockTradeService.js';
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import { useOverlayStore } from '../../../stores/useOverlayStore.js';
import AppIcon from '../../common/AppIcon.vue';
import BaseBadge from '../../ui/BaseBadge.vue';

defineProps({
  trades: { type: Array, required: true }
});

const ledgerStore = useLedgerStore();
const overlayStore = useOverlayStore();

const getPrincipal = (t) => Math.floor(Math.round(t.shares * t.price * 100) / 100);

function handleDeleteTrade(trade) {
  overlayStore.openConfirm({
    id: 'del-stock-trade-confirm',
    title: '刪除股票交易紀錄',
    message: `確定要刪除「${trade.date} ${trade.type === 'buy' ? '買入' : '賣出'} ${trade.shares} 股 ${trade.symbol}」嗎？這會一併刪除交割戶上連動的股款、手續費與證交稅紀錄。`,
    confirmText: '確定刪除',
    isDanger: true,
    onConfirm: async () => {
      await removeStockTradeWithSettlement(trade);
      await ledgerStore.refreshData();
    }
  });
}
</script>

<template>
  <div v-if="trades.length === 0" class="py-10 text-center text-xs text-slate-400">
    尚無買賣歷史紀錄
  </div>

  <div v-else class="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden bg-white">
    <div v-for="t in trades" :key="t.id" class="p-3 flex items-center justify-between">
      <div class="min-w-0">
        <div class="flex items-center space-x-1.5">
          <BaseBadge :variant="t.type === 'buy' ? 'rose' : 'emerald'" class="font-bold">
            {{ t.type === 'buy' ? '買入' : '賣出' }}
          </BaseBadge>
          <span class="text-sm font-bold text-slate-900">{{ t.symbol }}</span>
          <span class="text-xs text-slate-600">{{ t.shares.toLocaleString() }} 股 @ {{ t.price }}</span>
        </div>
        <div class="text-xs text-slate-400 mt-1">
          交易日 {{ t.date }} (交割 {{ t.settlementDate || '-' }}) · 手續費 ${{ t.fee || 0 }}{{ t.tax ? ` · 稅 $${t.tax}` : '' }}
        </div>
      </div>

      <div class="flex items-center space-x-2 shrink-0 ml-2">
        <span class="text-sm font-semibold text-slate-900">{{ formatCurrency(getPrincipal(t)) }}</span>
        <button type="button" @click="handleDeleteTrade(t)" class="p-1 text-slate-400 hover:text-rose-600">
          <AppIcon name="x" className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
