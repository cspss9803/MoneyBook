import { computed } from 'vue';
import { useLedgerStore } from '../stores/useLedgerStore.js';
import { calculateReceivables } from '../domain/calculateReceivables.js';

export function useMonthlySummary() {
  const ledgerStore = useLedgerStore();
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const monthPrefix = todayStr.slice(0, 7);

  const txMap = computed(() => new Map(ledgerStore.transactions.map((t) => [t.id, t])));
  const statsRec = computed(() => calculateReceivables(ledgerStore.transactions, todayStr));
  const allRec = computed(() => calculateReceivables(ledgerStore.transactions, null));

  const summary = computed(() => {
    let monthIncome = 0, monthExpense = 0, creditDebt = 0;
    const { advanceMap, repaymentOverflowMap, totalReceivable } = statsRec.value;

    for (const tx of ledgerStore.transactions) {
      if (tx.date > todayStr) continue;
      if (tx.type === 'expense' && ledgerStore.accountMap.get(tx.accountId)?.type === 'credit') creditDebt += tx.amount;
      if (tx.type === 'transfer' && ledgerStore.accountMap.get(tx.toAccountId)?.type === 'credit') creditDebt -= tx.amount;

      if (tx.date.startsWith(monthPrefix) && !tx.excludeFromStats) {
        if (tx.type === 'expense') {
          monthExpense += advanceMap.get(tx.id)?.effectiveExpense ?? tx.amount;
        } else if (tx.type === 'income') {
          monthIncome += tx.categoryId === 'cat_sys_repayment'
            ? (repaymentOverflowMap.get(tx.id) || 0)
            : (tx.otherAmount >= 1 ? Math.max(0, tx.myAmount ?? tx.amount - tx.otherAmount) : tx.amount);
        }
      }
    }
    return { monthIncome, monthExpense, balance: monthIncome - monthExpense, creditDebt: Math.max(0, creditDebt), totalReceivable };
  });

  const groupedByDate = computed(() => {
    const map = new Map();
    ledgerStore.transactions.forEach((tx) => {
      if (!map.has(tx.date)) map.set(tx.date, []);
      map.get(tx.date).push(tx);
    });
    return Array.from(map.entries());
  });

  return { todayStr, txMap, allRec, summary, groupedByDate };
}
