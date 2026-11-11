<script setup>
import { reactive, ref, computed } from 'vue';
import { addTradingDays } from '../../../domain/addTradingDays.js';
import { inferTaxRateFromSymbol } from '../../../domain/calculateStockPortfolio.js';
import { calculateAutoFeeAndTax, createStockTradeWithSettlement } from '../../../domain/stockTradeService.js';
import { formatCurrency } from '../../../domain/formatCurrency.js';
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import BaseSegmented from '../../ui/BaseSegmented.vue';
import BaseInput from '../../ui/BaseInput.vue';
import FormDatePicker from '../../ui/FormDatePicker.vue';

const props = defineProps({
  account: { type: Object, required: true },
  portfolio: { type: Object, required: true },
  settlementBank: { type: Object, default: null }
});

const emit = defineEmits(['submitted']);
const ledgerStore = useLedgerStore();

const todayStr = new Date().toLocaleDateString('sv-SE');
const errorMsg = ref('');

const form = reactive({
  tradeType: 'buy',
  date: todayStr,
  symbol: '',
  shares: '',
  price: '',
  feeDiscount: props.account.feeDiscount || 10,
  taxRate: 0.3,
  fee: '',
  tax: 0
});

const isBuy = computed(() => form.tradeType === 'buy');
const tPlus2Date = computed(() => addTradingDays(form.date, 2));
const rawPrincipal = computed(() => calculateAutoFeeAndTax(form).principal);
const totalSettle = computed(() => {
  const feeNum = Math.max(0, Math.floor(Number(form.fee) || 0));
  const taxNum = isBuy.value ? 0 : Math.max(0, Math.floor(Number(form.tax) || 0));
  return isBuy.value ? rawPrincipal.value + feeNum : Math.max(0, rawPrincipal.value - feeNum - taxNum);
});

function syncFeeAndTax() {
  const { fee, tax } = calculateAutoFeeAndTax(form);
  form.fee = fee;
  form.tax = tax;
}

function onSymbolInput(e) {
  form.symbol = e.target.value.trim().toUpperCase();
  if (form.symbol.length >= 4) form.taxRate = inferTaxRateFromSymbol(form.symbol);
  syncFeeAndTax();
}

async function handleSubmit() {
  errorMsg.value = '';
  try {
    const symbol = await createStockTradeWithSettlement({
      account: props.account,
      portfolio: props.portfolio,
      form
    });
    await ledgerStore.refreshData();
    ledgerStore.syncPrices(symbol).catch(() => {});
    emit('submitted');
  } catch (err) {
    errorMsg.value = err.message;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-3">
    <BaseSegmented
      v-model="form.tradeType"
      @update:modelValue="syncFeeAndTax"
      :options="[{ label: '買入股票', value: 'buy' }, { label: '賣出股票', value: 'sell' }]"
    />

    <div class="grid grid-cols-2 gap-3">
      <FormDatePicker v-model="form.date" :label="isBuy ? '買入日期' : '賣出日期'" />
      <BaseInput :modelValue="form.symbol" @input="onSymbolInput" label="股票代號" placeholder="例如：00937B、2330" bold uppercase required />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <BaseInput v-model="form.shares" @input="syncFeeAndTax" label="股數 (整數股)" type="number" step="1" min="1" placeholder="例如：1000" bold required />
      <BaseInput v-model="form.price" @input="syncFeeAndTax" label="成交股價 (可含小數)" type="number" step="0.01" min="0.01" placeholder="例如：14.47" bold required />
    </div>

    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
      <div :class="['grid gap-3', isBuy ? 'grid-cols-1' : 'grid-cols-2']">
        <BaseInput v-model="form.feeDiscount" @input="syncFeeAndTax" label="手續費折數 (無折扣填 10)" type="number" step="0.01" min="0.1" max="10" bold />
        <BaseInput v-if="!isBuy" v-model="form.taxRate" @input="syncFeeAndTax" label="證交稅率 (%)" type="number" step="0.01" min="0" max="10" bold />
      </div>
      <BaseSegmented
        v-if="!isBuy"
        v-model="form.taxRate"
        @update:modelValue="syncFeeAndTax"
        :options="[{ label: '一般 0.3%', value: 0.3 }, { label: 'ETF 0.1%', value: 0.1 }, { label: '債券型ETF 0%', value: 0 }]"
      />
    </div>

    <div :class="['grid gap-3', isBuy ? 'grid-cols-1' : 'grid-cols-2']">
      <BaseInput v-model="form.fee" label="手續費 (捨去，最低 1 元)" type="number" step="1" min="0" placeholder="0" bold />
      <BaseInput v-if="!isBuy" v-model="form.tax" label="證交稅 (無條件捨去)" type="number" step="1" min="0" placeholder="0" bold />
    </div>

    <div class="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
      <div class="flex justify-between"><span class="text-slate-500">成交股款 (無條件捨去)：</span><span class="font-semibold">{{ formatCurrency(rawPrincipal) }}</span></div>
      <div class="flex justify-between"><span class="text-slate-500">T+2 預計交割日：</span><span class="font-semibold">{{ tPlus2Date }} ({{ settlementBank?.name || '未綁定' }})</span></div>
      <div class="flex justify-between pt-1 border-t border-slate-200">
        <span class="font-medium">{{ isBuy ? '交割戶應扣總額：' : '交割戶應收淨額：' }}</span>
        <span :class="['font-bold', isBuy ? 'text-rose-600' : 'text-emerald-600']">{{ formatCurrency(totalSettle) }}</span>
      </div>
    </div>

    <div v-if="errorMsg" class="text-xs text-rose-600">{{ errorMsg }}</div>
    <button type="submit" class="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-md active:bg-slate-700">
      確認新增{{ isBuy ? '買入' : '賣出' }}（並建立 T+2 交割預記帳）
    </button>
  </form>
</template>
