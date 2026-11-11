export function calculateAccountBalance(account, transactions) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let balance = account.type === 'credit' ? 0 : Math.round(Number(account.initialBalance) || 0);

  for (const tx of transactions) {
    if (tx.date > todayStr) continue;

    const amount = Math.round(Number(tx.amount) || 0);

    if (tx.type === 'income' && tx.accountId === account.id && account.type !== 'credit') {
      balance += amount;
    } else if (tx.type === 'expense' && tx.accountId === account.id) {
      balance -= amount;
    } else if (tx.type === 'transfer') {
      if (tx.accountId === account.id && account.type !== 'credit') balance -= amount;
      if (tx.toAccountId === account.id) balance += amount;
    }
  }

  return balance;
}
