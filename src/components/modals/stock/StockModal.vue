<script setup>
import { ref, computed, watch } from 'vue';
import { STORES } from '../../../config/constants.js';
import { updateRecord } from '../../../db/updateRecord.js';
import { calculateStockPortfolio } from '../../../domain/calculateStockPortfolio.js';
import { formatCurrency } from '../../../domain/formatCurrency.js';
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import { useOverlayStore } from '../../../stores/useOverlayStore.js';
import AppIcon from '../../common/AppIcon.vue';
import BaseBottomSheet from '../../ui/BaseBottomSheet.vue';
import BaseSegmented from '../../ui/BaseSegmented.vue';
import StockHoldingsTab from './StockHoldingsTab.vue';
import StockTradeForm from './StockTradeForm.vue';
import StockHistoryTab from './StockHistoryTab.vue';

const ledgerStore = useLedgerStore();
const overlayStore = useOverlayStore();
const modalState = overlayStore.stockModal;

const subTab = ref('holdings');
const isSyncing = ref(false);
const subTabOptions = [
  { label: '庫存明細', value: 'holdings' },
  { label: '買賣記錄', value: 'trade' },
  { label: '歷史紀錄', value: 'history' }
];

watch(() => modalState.open, (isOpen) => {
  if (isOpen) subTab.value = 'holdings';
});

const freshAccount = computed(
  () => ledgerStore.accounts.find((a) => a.id === modalState.stockAccount?.id) || modalState.stockAccount
);
const settlementBank = computed(() => ledgerStore.accountMap.get(freshAccount.value?.settlementAccountId));
const portfolio = computed(() =>
  freshAccount.value ? calculateStockPortfolio(freshAccount.value, ledgerStore.stockTrades, ledgerStore.stockPrices) : null
);
const accountTrades = computed(() => ledgerStore.stockTrades.filter((t) => t.accountId === freshAccount.value?.id));

function handleEditAccount() {
  const target = freshAccount.value;
  overlayStore.closeStockModal();
  overlayStore.openAccountModal(target);
}

async function toggleDeductSellFee(e) {
  if (!freshAccount.value) return;
  await updateRecord(STORES.ACCOUNTS, { ...freshAccount.value, deductSellFeeInValue: e.target.checked });
  await ledgerStore.refreshData();
}

async function handleSyncPrices() {
  if (isSyncing.value) return;
  isSyncing.value = true;
  try {
    await ledgerStore.syncPrices(true);
  } finally {
    isSyncing.value = false;
  }
}
</script>

<template>
  <BaseBottomSheet
    :open="Boolean(modalState.open && freshAccount && portfolio)"
    :title="freshAccount?.name || ''"
    maxHeight="max-h-[92vh]"
    @close="overlayStore.closeStockModal()"
  >
    <template #title-actions>
      <button type="button" @click="handleEditAccount" title="編輯帳戶設定" class="p-1 text-slate-400 hover:text-slate-700 rounded">
        <AppIcon name="pencil" className="w-4 h-4" />
      </button>
    </template>

    <div v-if="portfolio" class="bg-slate-50 border border-slate-200 rounded-md p-3 mb-3 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-500">
          交割：{{ settlementBank ? settlementBank.name : '未綁定' }} · 手續費 {{ portfolio.feeDiscount < 10 ? `${portfolio.feeDiscount} 折` : '無折扣' }}
        </span>
        <button type="button" @click="handleSyncPrices" class="text-xs font-semibold text-slate-700 underline">
          {{ isSyncing ? '查價中...' : '手動更新收盤價' }}
        </button>
      </div>

      <div class="grid grid-cols-3 divide-x divide-slate-200 text-center py-1">
        <div class="px-1">
          <div class="text-[11px] text-slate-500 mb-0.5">目前總現值</div>
          <div class="text-xs font-bold text-slate-900">{{ formatCurrency(portfolio.totalMarketValue) }}</div>
        </div>
        <div class="px-1">
          <div class="text-[11px] text-slate-500 mb-0.5">庫存總成本</div>
          <div class="text-xs font-bold text-slate-700">{{ formatCurrency(portfolio.totalCost) }}</div>
        </div>
        <div class="px-1">
          <div class="text-[11px] text-slate-500 mb-0.5">未實現損益</div>
          <div :class="['text-xs font-bold', portfolio.totalUnrealizedPnL > 0 ? 'text-emerald-600' : portfolio.totalUnrealizedPnL < 0 ? 'text-rose-600' : 'text-slate-500']">
            {{ portfolio.totalUnrealizedPnL > 0 ? '+' : '' }}{{ formatCurrency(portfolio.totalUnrealizedPnL) }}
          </div>
        </div>
      </div>

      <label class="flex items-center space-x-2 pt-2 border-t border-slate-200 cursor-pointer">
        <input type="checkbox" :checked="freshAccount.deductSellFeeInValue" @change="toggleDeductSellFee" class="w-4 h-4 rounded border-slate-300 text-slate-900" />
        <span class="text-xs text-slate-600">現值與損益預先扣除賣出手續費與證交稅（逐筆計算）</span>
      </label>
    </div>

    <BaseSegmented v-model="subTab" :options="subTabOptions" class="mb-3" />

    <StockHoldingsTab v-if="subTab === 'holdings' && portfolio" :portfolio="portfolio" />
    <StockTradeForm
      v-else-if="subTab === 'trade' && portfolio"
      :account="freshAccount"
      :portfolio="portfolio"
      :settlementBank="settlementBank"
      @submitted="subTab = 'holdings'"
    />
    <StockHistoryTab v-else-if="subTab === 'history'" :trades="accountTrades" />
  </BaseBottomSheet>
</template>
