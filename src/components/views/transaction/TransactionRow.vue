<template>
  <div class="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
    <!-- 這一行與內層文字區塊補上 flex-1 -->
    <div class="flex items-center space-x-3 min-w-0 flex-1">
      <div
        class="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
        :class="tx.type === 'transfer' ? 'bg-slate-100 border border-slate-200 text-slate-600' : 'text-white'"
        :style="tx.type !== 'transfer' ? { backgroundColor: cat?.color || '#64748b' } : {}"
      >
        <AppIcon :name="tx.type === 'transfer' ? 'arrowRight' : (cat?.iconData || 'tag')" :className="tx.type === 'transfer' ? 'w-4 h-4' : 'w-5 h-5'" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center flex-wrap gap-1">
          <span class="text-sm font-medium text-slate-900 truncate">{{ title }}</span>
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