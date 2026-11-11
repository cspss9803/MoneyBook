export function calculateReceivables(transactions, maxDateStr = null) {
  const validTx = maxDateStr
    ? transactions.filter((tx) => tx.date <= maxDateStr)
    : transactions;

  // 1. 找出所有含有「幫人代墊 (otherAmount >= 1)」的支出紀錄
  const advanceMap = new Map();
  for (const tx of validTx) {
    if (tx.type === 'expense') {
      const total = Math.round(Number(tx.amount) || 0);
      const otherAmt = Math.round(Number(tx.otherAmount) || 0);
      if (otherAmt >= 1) {
        const myAmt = Math.max(0, total - otherAmt);
        advanceMap.set(tx.id, {
          txId: tx.id,
          totalAmount: total,
          myAmount: myAmt,
          advancedAmount: otherAmt,
          repaidAmount: 0,
          remainingOwed: otherAmt,
          effectiveExpense: total,
          overflowAmount: 0,
          isSettled: false
        });
      }
    }
  }

  // 2. 依時間先後順序處理所有「還款 (cat_sys_repayment)」紀錄
  const repayments = validTx
    .filter((tx) => tx.type === 'income' && tx.categoryId === 'cat_sys_repayment')
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

  // 記錄每一筆「還款紀錄」本身產生了多少溢出金額
  const repaymentOverflowMap = new Map();

  for (const rep of repayments) {
    const repAmount = Math.round(Number(rep.amount) || 0);
    const target = rep.repayTargetId ? advanceMap.get(rep.repayTargetId) : null;

    if (!target) {
      // 若未指定目標或目標代墊紀錄已被刪除，整筆還款視為溢出還款
      repaymentOverflowMap.set(rep.id, repAmount);
      continue;
    }

    const stillOwedBefore = target.remainingOwed;
    const offsetPart = Math.min(stillOwedBefore, repAmount);
    const overflowPart = Math.max(0, repAmount - stillOwedBefore);

    target.repaidAmount += repAmount;
    target.remainingOwed = Math.max(0, stillOwedBefore - offsetPart);
    target.effectiveExpense = Math.max(
      0,
      target.totalAmount - Math.min(target.advancedAmount, target.repaidAmount)
    );
    target.overflowAmount += overflowPart;
    target.isSettled = target.remainingOwed === 0;

    repaymentOverflowMap.set(rep.id, overflowPart);
  }

  // 3. 計算總應收帳款 (別人還欠我的總額)
  let totalReceivable = 0;
  for (const info of advanceMap.values()) {
    totalReceivable += info.remainingOwed;
  }

  return {
    advanceMap,
    repaymentOverflowMap,
    totalReceivable
  };
}
