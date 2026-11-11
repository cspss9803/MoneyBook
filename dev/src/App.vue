<script setup>
import { useLedgerStore } from './stores/useLedgerStore.js';
import BottomNav from './components/common/BottomNav.vue';
import ConfirmModal from './components/common/ConfirmModal.vue';
import DatePickerModal from './components/common/DatePickerModal.vue';
import SelectPickerModal from './components/common/SelectPickerModal.vue';

import TransactionView from './components/views/transaction/TransactionView.vue';
import AccountView from './components/views/account/AccountView.vue';
import StatsView from './components/views/stats/StatsView.vue';
import SettingsView from './components/views/settings/SettingsView.vue';

import CategoryModal from './components/modals/CategoryModal.vue';
import AccountModal from './components/modals/AccountModal.vue';
import TransactionModal from './components/modals/transaction/TransactionModal.vue';
import StockModal from './components/modals/stock/StockModal.vue';

const ledgerStore = useLedgerStore();
</script>

<template>
  <div class="max-w-md mx-auto min-h-screen bg-slate-50 border-x border-slate-200 pb-20 relative">
    <main class="p-4">
      <TransactionView v-if="ledgerStore.currentTab === 'transactions'" />
      <AccountView v-else-if="ledgerStore.currentTab === 'accounts'" />
      <StatsView v-else-if="ledgerStore.currentTab === 'stats'" />
      <SettingsView v-else-if="ledgerStore.currentTab === 'settings'" />
    </main>

    <BottomNav />

    <CategoryModal />
    <AccountModal />
    <TransactionModal />
    <StockModal />
    <SelectPickerModal />
    <DatePickerModal />
    <ConfirmModal />
  </div>
</template>
