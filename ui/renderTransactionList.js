import { store } from '../state/store.js';
import { formatCurrency } from '../domain/formatCurrency.js';
import { renderIcon } from './renderIcon.js';
import { renderTransactionModal } from './renderTransactionModal.js';

export function renderTransactionList(container) {
    const { transactions, accounts, categories } = store;
    const accountMap = new Map(accounts.map((a) => [a.id, a]));
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach((tx) => {
        if (tx.date.startsWith(currentMonthPrefix) && !tx.excludeFromStats) {
        if (tx.type === 'income') monthIncome += tx.amount;
        if (tx.type === 'expense') monthExpense += tx.amount;
        }
    });

    const groupedByDate = new Map();
    transactions.forEach((tx) => {
        if (!groupedByDate.has(tx.date)) {
            groupedByDate.set(tx.date, []);
        }
        groupedByDate.get(tx.date).push(tx);
    });

    let listHtml = '';
    if (transactions.length === 0) {
        listHtml = `
            <div class="bg-white border border-slate-200 rounded-md p-8 text-center text-sm text-slate-400">
                尚無任何記帳紀錄，請點擊下方「＋」新增。
            </div>
        `;
    } else {
        listHtml = Array.from(groupedByDate.entries())
        .map(([date, items]) => {
            const rowsHtml = items
            .map((tx) => {
                const fromAcc = accountMap.get(tx.accountId)?.name || '未知帳戶';

                if (tx.type === 'transfer') {
                    const toAcc = accountMap.get(tx.toAccountId)?.name || '未知帳戶';
                    const title = tx.name || '帳戶轉移';
                    return `
                        <div data-tx-id="${tx.id}" class="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
                        <div class="flex items-center space-x-3 min-w-0">
                            <div class="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </div>
                            <div class="min-w-0">
                            <div class="text-sm font-medium text-slate-900 truncate">${title}</div>
                            <div class="text-xs text-slate-500 truncate">${fromAcc} ➔ ${toAcc}${tx.note ? ` · ${tx.note}` : ''}</div>
                            </div>
                        </div>
                        <div class="text-sm font-semibold text-slate-700 shrink-0 ml-2">
                            ${formatCurrency(tx.amount)}
                        </div>
                        </div>
                    `;
                }

                const cat = categoryMap.get(tx.categoryId);
                const title = tx.name || cat?.name || '未分類';
                const color = cat?.color || '#64748b';
                const isExpense = tx.type === 'expense';
                const amountColor = isExpense ? 'text-rose-600' : 'text-emerald-600';
                const sign = isExpense ? '-' : '+';

                return `
                    <div data-tx-id="${tx.id}" class="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
                        <div class="flex items-center space-x-3 min-w-0">
                        <div class="w-9 h-9 rounded-md flex items-center justify-center text-white shrink-0" style="background-color: ${color}">
                            ${renderIcon(cat?.iconType || 'preset', cat?.iconData || 'tag', 'w-5 h-5')}
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center space-x-1.5">
                            <span class="text-sm font-medium text-slate-900 truncate">${title}</span>
                            ${tx.excludeFromStats ? '<span class="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded">不計統計</span>' : ''}
                            </div>
                            <div class="text-xs text-slate-500 truncate">
                            ${cat?.name || '未分類'} · ${fromAcc}${tx.note ? ` · ${tx.note}` : ''}
                            </div>
                        </div>
                        </div>
                        <div class="text-sm font-semibold ${amountColor} shrink-0 ml-2">
                        ${sign}${formatCurrency(tx.amount)}
                        </div>
                    </div>
                `;
            })
            .join('');

            return `
                <div class="bg-white border border-slate-200 rounded-md overflow-hidden mb-3">
                    <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span class="text-xs font-semibold text-slate-600">${date}</span>
                    <span class="text-xs text-slate-400">${items.length} 筆</span>
                    </div>
                    <div class="divide-y divide-slate-100">
                    ${rowsHtml}
                    </div>
                </div>
            `;
        })
        .join('');
    }

    container.innerHTML = `
        <header class="mb-4">
        <h1 class="text-lg font-bold text-slate-900 mb-3">收支明細</h1>
        <div class="bg-white border border-slate-200 rounded-md p-3 grid grid-cols-3 divide-x divide-slate-200 text-center">
            <div>
            <div class="text-xs text-slate-500 mb-1">本月收入</div>
            <div class="text-sm font-bold text-emerald-600">${formatCurrency(monthIncome)}</div>
            </div>
            <div>
            <div class="text-xs text-slate-500 mb-1">本月支出</div>
            <div class="text-sm font-bold text-rose-600">${formatCurrency(monthExpense)}</div>
            </div>
            <div>
            <div class="text-xs text-slate-500 mb-1">本月結餘</div>
            <div class="text-sm font-bold text-slate-900">${formatCurrency(monthIncome - monthExpense)}</div>
            </div>
        </div>
        </header>
        <section>${listHtml}</section>
    `;

    container.querySelectorAll('[data-tx-id]').forEach((row) => {
        row.addEventListener('click', () => {
        const targetTx = store.transactions.find((t) => t.id === row.dataset.txId);
        if (targetTx) renderTransactionModal(targetTx);
        });
    });
}