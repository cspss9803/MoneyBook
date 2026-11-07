export function calculateAccountBalance(account, transactions) {
    let balance = Math.round(Number(account.initialBalance) || 0);

    for (const tx of transactions) {
        const amount = Math.round(Number(tx.amount) || 0);

        if (tx.type === 'income' && tx.accountId === account.id) {
            balance += amount;
        } else if (tx.type === 'expense' && tx.accountId === account.id) {
            balance -= amount;
        } else if (tx.type === 'transfer') {
            if (tx.accountId === account.id) balance -= amount;
            if (tx.toAccountId === account.id) balance += amount;
        }
    }

    return balance;
}