import { STORES } from '../config/constants.js';
import { addRecord } from '../db/addRecord.js';
import { updateRecord } from '../db/updateRecord.js';
import { parseIntegerAmount } from './parseIntegerAmount.js';
import { formatCurrency } from './formatCurrency.js';

export function buildAdvanceCandidateOptions(transactions, advanceMap, categoryMap) {
  return transactions
    .filter((tx) => tx.type === 'expense' && (tx.otherAmount || 0) >= 1)
    .map((tx) => {
      const info = advanceMap.get(tx.id);
      const remaining = info ? info.remainingOwed : tx.otherAmount;
      const repaid = info ? info.repaidAmount : 0;
      const title = tx.name || categoryMap.get(tx.categoryId)?.name || '支出';
      return {
        value: tx.id,
        label: `${tx.date} · ${title} (尚欠 ${formatCurrency(remaining)})`,
        subLabel: `代墊 ${formatCurrency(tx.otherAmount)} · 已還 ${formatCurrency(repaid)} · 尚欠 ${formatCurrency(remaining)}`,
        icon: categoryMap.get(tx.categoryId)?.iconData || 'tag',
        remaining,
        date: tx.date
      };
    })
    .sort((a, b) =>
      (b.remaining > 0) !== (a.remaining > 0) ? (b.remaining > 0 ? 1 : -1) : b.date.localeCompare(a.date)
    );
}

export async function saveTransactionRecord(form, editingTx = null) {
  const isTransfer = form.type === 'transfer';
  const isRepayment = form.type === 'income' && form.categoryId === 'cat_sys_repayment';

  if (!form.accountId) throw new Error('請先建立至少一個非信用卡的現金或銀行帳戶');
  if (isTransfer && form.accountId === form.toAccountId) throw new Error('轉出帳戶與轉入帳戶不能相同');
  if (isRepayment && !form.repayTargetId) throw new Error('請先選擇要沖銷的代墊支出紀錄');

  const totalAmount = parseIntegerAmount(form.amount, false);
  let otherAmount = 0;
  let myAmount = totalAmount;

  if (!isTransfer && !isRepayment && form.hasSplit) {
    otherAmount = Math.min(totalAmount, Math.max(0, Math.round(Number(form.otherAmount) || 0)));
    myAmount = Math.max(0, totalAmount - otherAmount);
  }

  const record = {
    id: editingTx?.id || `tx_${Date.now()}`,
    type: form.type,
    amount: totalAmount,
    myAmount,
    otherAmount,
    repayTargetId: isRepayment ? form.repayTargetId : null,
    name: form.name.trim(),
    date: form.date,
    accountId: form.accountId,
    toAccountId: isTransfer ? form.toAccountId : null,
    categoryId: isTransfer ? null : form.categoryId,
    note: form.note.trim(),
    excludeFromStats: isTransfer ? true : isRepayment ? false : Boolean(form.excludeFromStats),
    createdAt: editingTx?.createdAt || Date.now()
  };

  if (editingTx) {
    await updateRecord(STORES.TRANSACTIONS, record);
  } else {
    await addRecord(STORES.TRANSACTIONS, record);
  }
}
