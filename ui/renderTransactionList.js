import { store } from '../state/store.js';
import { formatCurrency } from '../domain/formatCurrency.js';
import { calculateReceivables } from '../domain/calculateReceivables.js';
import { renderIcon } from './renderIcon.js';
import { renderTransactionModal } from './renderTransactionModal.js';

export function renderTransactionList(container) {
  const { transactions, accounts, categories } = store;
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const txMap = new Map(transactions.map((t) => [t.id, t]));

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthPrefix = todayStr.slice(0, 7);

  // 計算截至今日的代墊應收帳款與全部紀錄的代墊狀態
  const { advanceMap: statsAdvanceMap, repaymentOverflowMap, totalReceivable } = calculateReceivables(transactions, todayStr);
  const { advanceMap: allAdvanceMap, repaymentOverflowMap: allOverflowMap } = calculateReceivables(transactions, null);

  let monthIncome = 0;
  let monthExpense = 0;
  let creditCardDebt = 0;

  transactions.forEach((tx) => {
    if (tx.date > todayStr) return;

    const fromAcc = accountMap.get(tx.accountId);
    const toAcc = accountMap.get(tx.toAccountId);

    // 累計信用卡真實帳單負債與還款折抵
    if (tx.type === 'expense' && fromAcc?.type === 'credit') {
      creditCardDebt += tx.amount;
    } else if (tx.type === 'transfer' && toAcc?.type === 'credit') {
      creditCardDebt -= tx.amount;
    }

    // 本月收支統計（扣除已被歸還的代墊款；還款僅統計溢出部分）
    if (tx.date.startsWith(currentMonthPrefix) && !tx.excludeFromStats) {
      if (tx.type === 'expense') {
        const effectiveExp = statsAdvanceMap.has(tx.id)
          ? statsAdvanceMap.get(tx.id).effectiveExpense
          : tx.amount;
        monthExpense += effectiveExp;
      } else if (tx.type === 'income') {
        if (tx.categoryId === 'cat_sys_repayment') {
          monthIncome += repaymentOverflowMap.get(tx.id) || 0;
        } else if ((tx.otherAmount || 0) >= 1) {
          monthIncome += Math.max(0, tx.myAmount ?? tx.amount - tx.otherAmount);
        } else {
          monthIncome += tx.amount;
        }
      }
    }
  });

  const displayCreditDebt = Math.max(0, creditCardDebt);

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
        const isFuture = date > todayStr;
        const rowsHtml = items
          .map((tx) => {
            const fromAcc = accountMap.get(tx.accountId)?.name || '未知帳戶';

            if (tx.type === 'transfer') {
              const toAccObj = accountMap.get(tx.toAccountId);
              const toAcc = toAccObj?.name || '未知帳戶';
              const isCreditRepay = toAccObj?.type === 'credit';
              const title = tx.name || (isCreditRepay ? '信用卡還款' : '帳戶轉移');
              return `
                <div data-tx-id="${tx.id}" class="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
                  <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center space-x-1.5">
                        <span class="text-sm font-medium text-slate-900 truncate">${title}</span>
                        ${isFuture ? '<span class="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded shrink-0">預記</span>' : ''}
                      </div>
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

            // 代墊與還款狀態標籤
            let splitBadgeHtml = '';
            const advInfo = allAdvanceMap.get(tx.id);
            if (isExpense && advInfo) {
              if (advInfo.remainingOwed > 0) {
                splitBadgeHtml = `<span class="text-[10px] px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded shrink-0">待收 ${formatCurrency(advInfo.remainingOwed)}</span>`;
              } else {
                splitBadgeHtml = `<span class="text-[10px] px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded shrink-0">已收齊</span>`;
              }
            } else if (!isExpense && tx.categoryId === 'cat_sys_repayment') {
              const targetTx = txMap.get(tx.repayTargetId);
              const targetName = targetTx ? (targetTx.name || categoryMap.get(targetTx.categoryId)?.name || '代墊') : '代墊';
              const overflowAmt = allOverflowMap.get(tx.id) || 0;
              splitBadgeHtml = `<span class="text-[10px] px-1.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded shrink-0">沖銷：${targetName}${overflowAmt > 0 ? ` (溢出 +${formatCurrency(overflowAmt)})` : ''}</span>`;
            } else if (!isExpense && (tx.otherAmount || 0) >= 1) {
              splitBadgeHtml = `<span class="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded shrink-0">自留 ${formatCurrency(tx.myAmount)}</span>`;
            }

            return `
              <div data-tx-id="${tx.id}" class="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
                <div class="flex items-center space-x-3 min-w-0">
                  <div class="w-9 h-9 rounded-md flex items-center justify-center text-white shrink-0" style="background-color: ${color}">
                    ${renderIcon(cat?.iconType || 'preset', cat?.iconData || 'tag', 'w-5 h-5')}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center flex-wrap gap-1">
                      <span class="text-sm font-medium text-slate-900 truncate">${title}</span>
                      ${splitBadgeHtml}
                      ${isFuture ? '<span class="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded shrink-0">預記</span>' : ''}
                      ${tx.excludeFromStats ? '<span class="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded shrink-0">不計統計</span>' : ''}
                    </div>
                    <div class="text-xs text-slate-500 truncate">
                      ${cat?.name || '未分類'} · ${fromAcc}${tx.note ? ` · ${tx.note}` : ''}
                    </div>
                  </div>
                </div>
                <div class="text-right shrink-0 ml-2">
                  <div class="text-sm font-semibold ${amountColor}">
                    ${sign}${formatCurrency(tx.amount)}
                  </div>
                  ${
                    isExpense && advInfo && advInfo.repaidAmount > 0
                      ? `<div class="text-[10px] text-slate-400">實支 ${formatCurrency(advInfo.effectiveExpense)}</div>`
                      : ''
                  }
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
      <div class="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div class="p-3 grid grid-cols-4 divide-x divide-slate-200 text-center">
          <div class="px-1">
            <div class="text-[11px] text-slate-500 mb-1">本月收入</div>
            <div class="text-xs font-bold text-emerald-600 truncate">${formatCurrency(monthIncome)}</div>
          </div>
          <div class="px-1">
            <div class="text-[11px] text-slate-500 mb-1">本月支出</div>
            <div class="text-xs font-bold text-rose-600 truncate">${formatCurrency(monthExpense)}</div>
          </div>
          <div class="px-1">
            <div class="text-[11px] text-slate-500 mb-1">負債</div>
            <div class="text-xs font-bold text-amber-700 truncate">${formatCurrency(displayCreditDebt)}</div>
          </div>
          <div class="px-1">
            <div class="text-[11px] text-slate-500 mb-1">本月結餘</div>
            <div class="text-xs font-bold text-slate-900 truncate">${formatCurrency(monthIncome - monthExpense)}</div>
          </div>
        </div>
        <div class="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span class="text-slate-600 font-medium">應收帳款（幫人代墊待收回）</span>
          <span class="font-bold ${totalReceivable > 0 ? 'text-amber-700' : 'text-slate-400'}">${formatCurrency(totalReceivable)}</span>
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