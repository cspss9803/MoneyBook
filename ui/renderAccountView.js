import { ACCOUNT_TYPES } from '../config/constants.js';
import { store } from '../state/store.js';
import { calculateAccountBalance } from '../domain/calculateAccountBalance.js';
import { calculateStockPortfolio } from '../domain/calculateStockPortfolio.js';
import { formatCurrency } from '../domain/formatCurrency.js';
import { renderIcon } from './renderIcon.js';
import { renderAccountModal } from './renderAccountModal.js';
import { renderStockModal } from './renderStockModal.js';

export function renderAccountView(container) {
  const { accounts, transactions, stockTrades, stockPrices } = store;
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  let totalAssets = 0;
  let totalLiabilities = 0;

  const accountsWithBalance = accounts.map((acc) => {
    if (acc.type === 'stock') {
      const portfolio = calculateStockPortfolio(acc, stockTrades, stockPrices);
      totalAssets += portfolio.totalMarketValue;
      return {
        ...acc,
        balance: portfolio.totalMarketValue,
        portfolio
      };
    }

    const balance = calculateAccountBalance(acc, transactions);
    if (balance >= 0) {
      totalAssets += balance;
    } else {
      totalLiabilities += Math.abs(balance);
    }
    return { ...acc, balance };
  });

  const netWorth = totalAssets - totalLiabilities;

  const groupsHtml = ACCOUNT_TYPES.map((typeObj) => {
    const list = accountsWithBalance.filter((a) => a.type === typeObj.id);
    if (list.length === 0) return '';

    const groupTotal = list.reduce((sum, a) => sum + a.balance, 0);
    const rowsHtml = list
      .map((acc) => {
        if (acc.type === 'stock') {
          const bankName = accountMap.get(acc.settlementAccountId)?.name || '未綁定交割戶';
          const pnl = acc.portfolio?.totalUnrealizedPnL || 0;
          const pnlSign = pnl > 0 ? '+' : '';
          const pnlColor = pnl > 0 ? 'text-emerald-600' : pnl < 0 ? 'text-rose-600' : 'text-slate-400';
          const discountText =
            acc.portfolio?.feeDiscount && acc.portfolio.feeDiscount < 10
              ? `${acc.portfolio.feeDiscount}折`
              : '無折扣';

          return `
            <div data-acc-id="${acc.id}" class="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
              <div class="flex items-center space-x-3 min-w-0">
                <div class="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  ${renderIcon(acc.iconType, acc.iconData, 'w-5 h-5')}
                </div>
                <div class="min-w-0">
                  <div class="text-sm font-medium text-slate-900 truncate">${acc.name}</div>
                  <div class="text-xs text-slate-400 truncate">交割：${bankName} (${discountText}) · 持有 ${acc.portfolio?.holdings.length || 0} 檔</div>
                </div>
              </div>
              <div class="text-right shrink-0 ml-2">
                <div class="text-sm font-semibold text-slate-900">${formatCurrency(acc.balance)}</div>
                <div class="text-[11px] font-medium ${pnlColor}">損益 ${pnlSign}${formatCurrency(pnl)}</div>
              </div>
            </div>
          `;
        }

        const isCredit = acc.type === 'credit';
        const balColor = acc.balance < 0 ? 'text-rose-600' : 'text-slate-900';
        const subText = isCredit
          ? '信用卡（僅計消費與轉入還款）'
          : `初始資金 ${formatCurrency(acc.initialBalance)}`;

        return `
          <div data-acc-id="${acc.id}" class="p-3 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                ${renderIcon(acc.iconType, acc.iconData, 'w-5 h-5')}
              </div>
              <div class="min-w-0">
                <div class="text-sm font-medium text-slate-900 truncate">${acc.name}</div>
                <div class="text-xs text-slate-400">${subText}</div>
              </div>
            </div>
            <div class="text-sm font-semibold ${balColor} shrink-0 ml-2">
              ${formatCurrency(acc.balance)}
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="bg-white border border-slate-200 rounded-md overflow-hidden mb-3">
        <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span class="text-xs font-semibold text-slate-600">${typeObj.label}</span>
          <span class="text-xs font-medium text-slate-500">${formatCurrency(groupTotal)}</span>
        </div>
        <div class="divide-y divide-slate-100">
          ${rowsHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <header class="mb-4">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-lg font-bold text-slate-900">帳戶總覽</h1>
        <button id="btn-add-account" type="button" class="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md active:bg-slate-700">
          ＋ 新增帳戶
        </button>
      </div>
      <div class="bg-white border border-slate-200 rounded-md p-3">
        <div class="text-xs text-slate-500 mb-1">淨資產（含股票最新現值）</div>
        <div class="text-xl font-bold text-slate-900 mb-3">${formatCurrency(netWorth)}</div>
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <span class="text-slate-500">總資產：</span>
            <span class="font-semibold text-emerald-600">${formatCurrency(totalAssets)}</span>
          </div>
          <div>
            <span class="text-slate-500">總負債：</span>
            <span class="font-semibold text-rose-600">${formatCurrency(totalLiabilities)}</span>
          </div>
        </div>
      </div>
    </header>
    <section>
      ${
        groupsHtml ||
        '<div class="bg-white border border-slate-200 rounded-md p-8 text-center text-sm text-slate-400">尚無帳戶，請點擊右上角新增。</div>'
      }
    </section>
  `;

  container.querySelector('#btn-add-account')?.addEventListener('click', () => {
    renderAccountModal(null);
  });

  container.querySelectorAll('[data-acc-id]').forEach((row) => {
    row.addEventListener('click', () => {
      const target = store.accounts.find((a) => a.id === row.dataset.accId);
      if (!target) return;
      if (target.type === 'stock') {
        renderStockModal(target);
      } else {
        renderAccountModal(target);
      }
    });
  });
}