import { STORES } from '../config/constants.js';
import { store } from '../state/store.js';
import { refreshData } from '../state/refreshData.js';
import { addRecord } from '../db/addRecord.js';
import { updateRecord } from '../db/updateRecord.js';
import { deleteRecord } from '../db/deleteRecord.js';
import { addTradingDays } from '../domain/addTradingDays.js';
import { calculateStockPortfolio, inferTaxRateFromSymbol } from '../domain/calculateStockPortfolio.js';
import { syncDailyStockPrices } from '../domain/syncDailyStockPrices.js';
import { formatCurrency } from '../domain/formatCurrency.js';
import { renderIcon } from './renderIcon.js';
import { renderAccountModal } from './renderAccountModal.js';
import { openDatePicker } from './openDatePicker.js';
import { openConfirmModal } from './openConfirmModal.js';
import { pushOverlay } from './pushOverlay.js';
import { popOverlay } from './popOverlay.js';

export function renderStockModal(stockAccount) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot || !stockAccount) return;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const latestAccInit = store.accounts.find((a) => a.id === stockAccount.id) || stockAccount;
  const defaultDiscount =
    latestAccInit.feeDiscount && latestAccInit.feeDiscount > 0 && latestAccInit.feeDiscount <= 10
      ? latestAccInit.feeDiscount
      : 10;

  const uiState = {
    subTab: 'holdings', // 'holdings' | 'trade' | 'history'
    tradeType: 'buy',   // 'buy' | 'sell'
    date: todayStr,
    symbol: '',
    shares: '',
    price: '',
    feeDiscount: defaultDiscount,
    taxRate: 0.3,
    fee: '',
    tax: 0,
    isSyncing: false
  };

  function closeModal() {
    modalRoot.innerHTML = '';
    popOverlay('stock-modal');
  }

  pushOverlay('stock-modal', closeModal);

  function computeAutoFeeAndTax() {
    const sharesNum = Math.max(0, Math.floor(Number(uiState.shares) || 0));
    const priceNum = Math.max(0, Number(uiState.price) || 0);
    const principal = Math.floor(Math.round(sharesNum * priceNum * 100) / 100);

    const discNum = Number(uiState.feeDiscount);
    const validDisc = !Number.isNaN(discNum) && discNum > 0 && discNum <= 10 ? discNum : 10;
    const rawFee = Math.floor(principal * 0.001425 * (validDisc / 10) + 1e-9);
    // 單筆成交金額 > 0 時，手續費最低為 1 元
    const autoFee = principal > 0 ? Math.max(1, rawFee) : 0;

    const rateNum = Math.max(0, Number(uiState.taxRate) || 0);
    // 證交稅遵守無條件捨去，不足 1 元即為 0 元
    const autoTax =
      uiState.tradeType === 'sell' && principal > 0
        ? Math.floor(principal * (rateNum / 100) + 1e-9)
        : 0;

    uiState.fee = sharesNum > 0 && priceNum > 0 ? autoFee : '';
    uiState.tax = sharesNum > 0 && priceNum > 0 ? autoTax : 0;
  }

  function renderContent() {
    const freshAccount = store.accounts.find((a) => a.id === stockAccount.id) || stockAccount;
    const settlementBank = store.accounts.find((a) => a.id === freshAccount.settlementAccountId);
    const portfolio = calculateStockPortfolio(freshAccount, store.stockTrades, store.stockPrices);
    const accountTrades = store.stockTrades.filter((t) => t.accountId === freshAccount.id);

    const pnl = portfolio.totalUnrealizedPnL;
    const pnlSign = pnl > 0 ? '+' : '';
    const pnlColor = pnl > 0 ? 'text-emerald-600' : pnl < 0 ? 'text-rose-600' : 'text-slate-500';

    let bodyHtml = '';

    if (uiState.subTab === 'holdings') {
      if (portfolio.holdings.length === 0) {
        bodyHtml = `
          <div class="py-10 text-center text-xs text-slate-400">
            目前無持有庫存，請切換至「買賣記錄」新增買入。
          </div>
        `;
      } else {
        bodyHtml = `
          <div class="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden bg-white">
            ${portfolio.holdings
              .map((h) => {
                const itemPnl = h.unrealizedPnL;
                const itemSign = itemPnl > 0 ? '+' : '';
                const itemColor =
                  itemPnl > 0 ? 'text-emerald-600' : itemPnl < 0 ? 'text-rose-600' : 'text-slate-500';
                return `
                  <div class="p-3 flex items-center justify-between">
                    <div>
                      <div class="flex items-center space-x-1.5">
                        <span class="text-sm font-bold text-slate-900">${h.symbol}</span>
                        <span class="text-xs px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600">${h.shares.toLocaleString()} 股 (${h.lotCount} 筆)</span>
                      </div>
                      <div class="text-xs text-slate-500 mt-1">
                        均價 ${h.avgCost} · 收盤 ${h.currentPrice} <span class="text-[10px] text-slate-400">(${h.priceDate})</span>
                      </div>
                      <div class="text-[11px] text-slate-400 mt-0.5">
                        總成本 ${formatCurrency(h.totalCost)}${
                          portfolio.deductSellFee
                            ? ` · 預扣手續費 $${h.estimatedSellFee} / 稅 $${h.estimatedSellTax}`
                            : ''
                        }
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-bold text-slate-900">${formatCurrency(h.marketValue)}</div>
                      <div class="text-xs font-semibold ${itemColor}">
                        ${itemSign}${formatCurrency(itemPnl)} (${itemSign}${h.returnRate}%)
                      </div>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }
    } else if (uiState.subTab === 'trade') {
      const isBuy = uiState.tradeType === 'buy';
      const sharesNum = Math.max(0, Math.floor(Number(uiState.shares) || 0));
      const priceNum = Math.max(0, Number(uiState.price) || 0);
      const feeNum = Math.max(0, Math.floor(Number(uiState.fee) || 0));
      const taxNum = isBuy ? 0 : Math.max(0, Math.floor(Number(uiState.tax) || 0));
      const rawPrincipal = Math.floor(Math.round(sharesNum * priceNum * 100) / 100);
      const totalSettle = isBuy
        ? rawPrincipal + feeNum
        : Math.max(0, rawPrincipal - feeNum - taxNum);
      const tPlus2Date = addTradingDays(uiState.date, 2);

      bodyHtml = `
        <form id="stock-trade-form" class="space-y-3">
          <!-- 買入 / 賣出切換 -->
          <div class="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
            <button type="button" data-trade-type="buy" class="py-1.5 text-xs font-semibold rounded ${
              isBuy ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }">買入股票</button>
            <button type="button" data-trade-type="sell" class="py-1.5 text-xs font-semibold rounded ${
              !isBuy ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }">賣出股票</button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">${isBuy ? '買入日期' : '賣出日期'}</label>
              <button id="btn-pick-trade-date" type="button" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 font-medium flex items-center justify-between">
                <span>${uiState.date}</span>
                <svg class="w-4 h-4 text-slate-400 shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </button>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">股票代號</label>
              <input id="st-symbol" type="text" required placeholder="例如：00937B、2330" value="${uiState.symbol}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm uppercase font-semibold focus:outline-none focus:border-slate-900" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">股數 (整數股)</label>
              <input id="st-shares" type="number" step="1" min="1" required placeholder="例如：1000" value="${uiState.shares}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold focus:outline-none focus:border-slate-900" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">成交股價 (可含小數)</label>
              <input id="st-price" type="number" step="0.01" min="0.01" required placeholder="例如：14.47" value="${uiState.price}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold focus:outline-none focus:border-slate-900" />
            </div>
          </div>

          <!-- 費率與折數設定區塊 (修正對齊並提供三種證交稅率快捷鈕) -->
          <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-2.5">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">手續費折數 (無折扣 10)</label>
                <input id="st-fee-discount" type="number" step="0.01" min="0.1" max="10" value="${uiState.feeDiscount}" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:border-slate-900" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">證交稅率 (%)</label>
                <input id="st-tax-rate" type="number" step="0.01" min="0" max="10" value="${uiState.taxRate}" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:border-slate-900" />
              </div>
            </div>

            <!-- 證交稅率三等分快捷切換列 -->
            <div class="grid grid-cols-3 gap-1.5">
              <button type="button" data-tax-preset="0.3" class="py-1.5 px-2 text-xs font-semibold rounded border text-center ${
                Number(uiState.taxRate) === 0.3
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300'
              }">一般 0.3%</button>
              <button type="button" data-tax-preset="0.1" class="py-1.5 px-2 text-xs font-semibold rounded border text-center ${
                Number(uiState.taxRate) === 0.1
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300'
              }">ETF 0.1%</button>
              <button type="button" data-tax-preset="0" class="py-1.5 px-2 text-xs font-semibold rounded border text-center ${
                Number(uiState.taxRate) === 0
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300'
              }">債券型ETF 0%</button>
            </div>
          </div>

          <!-- 手續費與證交稅結果 (單行標籤對齊) -->
          <div class="grid ${isBuy ? 'grid-cols-1' : 'grid-cols-2'} gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">手續費 (捨去，最低 1 元)</label>
              <input id="st-fee" type="number" step="1" min="0" placeholder="0" value="${uiState.fee}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold focus:outline-none focus:border-slate-900" />
            </div>
            ${
              !isBuy
                ? `
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">證交稅 (無條件捨去)</label>
                <input id="st-tax" type="number" step="1" min="0" placeholder="0" value="${uiState.tax}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold focus:outline-none focus:border-slate-900" />
              </div>
            `
                : ''
            }
          </div>

          <!-- T+2 交割試算預覽 -->
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-500">成交股款 (無條件捨去)：</span>
              <span id="preview-principal" class="font-semibold text-slate-900">${formatCurrency(rawPrincipal)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">T+2 預計交割日：</span>
              <span class="font-semibold text-slate-900">${tPlus2Date} (${settlementBank ? settlementBank.name : '未綁定'})</span>
            </div>
            <div class="flex justify-between pt-1 border-t border-slate-200">
              <span class="text-slate-700 font-medium">${isBuy ? '交割戶應扣總額：' : '交割戶應收淨額：'}</span>
              <span id="preview-settle-total" class="font-bold ${isBuy ? 'text-rose-600' : 'text-emerald-600'}">${formatCurrency(totalSettle)}</span>
            </div>
          </div>

          <div id="st-error" class="text-xs text-rose-600 hidden"></div>

          <button type="submit" class="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-md active:bg-slate-700">
            確認新增${isBuy ? '買入' : '賣出'}（並建立 T+2 交割預記帳）
          </button>
        </form>
      `;
    } else if (uiState.subTab === 'history') {
      if (accountTrades.length === 0) {
        bodyHtml = `
          <div class="py-10 text-center text-xs text-slate-400">
            尚無買賣歷史紀錄
          </div>
        `;
      } else {
        bodyHtml = `
          <div class="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden bg-white">
            ${accountTrades
              .map((t) => {
                const isBuy = t.type === 'buy';
                const principal = Math.floor(Math.round(t.shares * t.price * 100) / 100);
                return `
                  <div class="p-3 flex items-center justify-between">
                    <div class="min-w-0">
                      <div class="flex items-center space-x-1.5">
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isBuy ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }">${isBuy ? '買入' : '賣出'}</span>
                        <span class="text-sm font-bold text-slate-900">${t.symbol}</span>
                        <span class="text-xs text-slate-600">${t.shares.toLocaleString()} 股 @ ${t.price}</span>
                      </div>
                      <div class="text-xs text-slate-400 mt-1">
                        交易日 ${t.date} (交割 ${t.settlementDate || '-'}) · 手續費 $${t.fee || 0}${t.tax ? ` · 稅 $${t.tax}` : ''}
                      </div>
                    </div>
                    <div class="flex items-center space-x-2 shrink-0 ml-2">
                      <span class="text-sm font-semibold text-slate-900">${formatCurrency(principal)}</span>
                      <button type="button" data-del-trade="${t.id}" class="p-1 text-slate-400 hover:text-rose-600">
                        ${renderIcon('preset', 'x', 'w-4 h-4')}
                      </button>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }
    }

    modalRoot.innerHTML = `
      <div id="stock-modal-backdrop" class="fixed inset-0 bg-slate-900/40 z-30 flex items-end justify-center">
        <div class="bg-white w-full max-w-md rounded-t-xl border-t border-slate-200 p-4 max-h-[92vh] overflow-y-auto">
          <!-- 標題列 -->
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div class="flex items-center space-x-2 min-w-0">
              <h2 class="text-base font-bold text-slate-900 truncate">${freshAccount.name}</h2>
              <button id="btn-edit-stock-acc" type="button" title="編輯帳戶設定" class="p-1 text-slate-400 hover:text-slate-700 rounded">
                ${renderIcon('preset', 'pencil', 'w-4 h-4')}
              </button>
            </div>
            <button id="btn-close-stock-modal" type="button" aria-label="關閉" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-md active:bg-slate-100">
              ${renderIcon('preset', 'x', 'w-5 h-5')}
            </button>
          </div>

          <!-- 股票資產摘要卡 -->
          <div class="bg-slate-50 border border-slate-200 rounded-md p-3 mb-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">
                交割：${settlementBank ? settlementBank.name : '未綁定'} · 手續費 ${portfolio.feeDiscount < 10 ? `${portfolio.feeDiscount} 折` : '無折扣'}
              </span>
              <button id="btn-sync-prices" type="button" class="text-xs font-semibold text-slate-700 underline">
                ${uiState.isSyncing ? '查價中...' : '手動更新收盤價'}
              </button>
            </div>

            <div class="grid grid-cols-3 divide-x divide-slate-200 text-center py-1">
              <div class="px-1">
                <div class="text-[11px] text-slate-500 mb-0.5">目前總現值</div>
                <div class="text-xs font-bold text-slate-900">${formatCurrency(portfolio.totalMarketValue)}</div>
              </div>
              <div class="px-1">
                <div class="text-[11px] text-slate-500 mb-0.5">庫存總成本</div>
                <div class="text-xs font-bold text-slate-700">${formatCurrency(portfolio.totalCost)}</div>
              </div>
              <div class="px-1">
                <div class="text-[11px] text-slate-500 mb-0.5">未實現損益</div>
                <div class="text-xs font-bold ${pnlColor}">${pnlSign}${formatCurrency(pnl)}</div>
              </div>
            </div>

            <!-- 現值預扣賣出手續費與證交稅切換開關 -->
            <label class="flex items-center space-x-2 pt-2 border-t border-slate-200 cursor-pointer">
              <input id="toggle-deduct-sell-fee" type="checkbox" ${freshAccount.deductSellFeeInValue ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0" />
              <span class="text-xs text-slate-600">現值與損益預先扣除賣出手續費與證交稅（逐筆計算）</span>
            </label>
          </div>

          <!-- 子分頁切換 -->
          <div class="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-md mb-3 border border-slate-200">
            <button type="button" data-sub-tab="holdings" class="py-1.5 text-xs font-semibold rounded ${
              uiState.subTab === 'holdings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }">庫存明細</button>
            <button type="button" data-sub-tab="trade" class="py-1.5 text-xs font-semibold rounded ${
              uiState.subTab === 'trade' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }">買賣記錄</button>
            <button type="button" data-sub-tab="history" class="py-1.5 text-xs font-semibold rounded ${
              uiState.subTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }">歷史紀錄</button>
          </div>

          ${bodyHtml}
        </div>
      </div>
    `;

    bindEvents(freshAccount, portfolio);
  }

  function syncFormInputs() {
    const symEl = modalRoot.querySelector('#st-symbol');
    const shEl = modalRoot.querySelector('#st-shares');
    const prEl = modalRoot.querySelector('#st-price');
    const discEl = modalRoot.querySelector('#st-fee-discount');
    const rateEl = modalRoot.querySelector('#st-tax-rate');
    const feeEl = modalRoot.querySelector('#st-fee');
    const taxEl = modalRoot.querySelector('#st-tax');

    if (symEl) uiState.symbol = symEl.value.trim().toUpperCase();
    if (shEl) uiState.shares = shEl.value;
    if (prEl) uiState.price = prEl.value;
    if (discEl) uiState.feeDiscount = discEl.value;
    if (rateEl) uiState.taxRate = rateEl.value;
    if (feeEl) uiState.fee = feeEl.value;
    if (taxEl) uiState.tax = taxEl.value;
  }

  function updatePresetButtonsHighlight() {
    modalRoot.querySelectorAll('[data-tax-preset]').forEach((btn) => {
      const active = Number(uiState.taxRate) === Number(btn.dataset.taxPreset);
      btn.className = `py-1.5 px-2 text-xs font-semibold rounded border text-center ${
        active
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-600 border-slate-300'
      }`;
    });
  }

  function updateLivePreviewDOM() {
    const isBuy = uiState.tradeType === 'buy';
    const sharesNum = Math.max(0, Math.floor(Number(uiState.shares) || 0));
    const priceNum = Math.max(0, Number(uiState.price) || 0);
    const feeNum = Math.max(0, Math.floor(Number(uiState.fee) || 0));
    const taxNum = isBuy ? 0 : Math.max(0, Math.floor(Number(uiState.tax) || 0));
    const rawPrincipal = Math.floor(Math.round(sharesNum * priceNum * 100) / 100);
    const totalSettle = isBuy
      ? rawPrincipal + feeNum
      : Math.max(0, rawPrincipal - feeNum - taxNum);

    const principalEl = modalRoot.querySelector('#preview-principal');
    const settleEl = modalRoot.querySelector('#preview-settle-total');
    if (principalEl) principalEl.textContent = formatCurrency(rawPrincipal);
    if (settleEl) settleEl.textContent = formatCurrency(totalSettle);
  }

  function bindEvents(freshAccount, portfolio) {
    const backdrop = modalRoot.querySelector('#stock-modal-backdrop');
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    modalRoot.querySelector('#btn-close-stock-modal')?.addEventListener('click', closeModal);

    modalRoot.querySelector('#btn-edit-stock-acc')?.addEventListener('click', () => {
      closeModal();
      renderAccountModal(freshAccount);
    });

    modalRoot.querySelector('#toggle-deduct-sell-fee')?.addEventListener('change', async (e) => {
      const updatedAcc = {
        ...freshAccount,
        deductSellFeeInValue: e.target.checked
      };
      await updateRecord(STORES.ACCOUNTS, updatedAcc);
      await refreshData();
      renderContent();
    });

    modalRoot.querySelector('#btn-sync-prices')?.addEventListener('click', async () => {
      if (uiState.isSyncing) return;
      uiState.isSyncing = true;
      renderContent();
      for (const h of portfolio.holdings) {
        await syncDailyStockPrices(h.symbol);
      }
      uiState.isSyncing = false;
      renderContent();
    });

    modalRoot.querySelectorAll('[data-sub-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncFormInputs();
        uiState.subTab = btn.dataset.subTab;
        renderContent();
      });
    });

    modalRoot.querySelectorAll('[data-trade-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncFormInputs();
        uiState.tradeType = btn.dataset.tradeType;
        computeAutoFeeAndTax();
        renderContent();
      });
    });

    modalRoot.querySelectorAll('[data-tax-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        syncFormInputs();
        uiState.taxRate = Number(btn.dataset.taxPreset);
        computeAutoFeeAndTax();
        renderContent();
      });
    });

    // 輸入股票代號時自動識別 00937B (0%) / 0050 (0.1%) / 一般個股 (0.3%)
    modalRoot.querySelector('#st-symbol')?.addEventListener('input', (e) => {
      const sym = e.target.value.trim().toUpperCase();
      uiState.symbol = sym;
      if (sym.length >= 4) {
        const inferredRate = inferTaxRateFromSymbol(sym);
        uiState.taxRate = inferredRate;
        const rateEl = modalRoot.querySelector('#st-tax-rate');
        if (rateEl) rateEl.value = inferredRate;
        updatePresetButtonsHighlight();
        computeAutoFeeAndTax();
        const feeEl = modalRoot.querySelector('#st-fee');
        const taxEl = modalRoot.querySelector('#st-tax');
        if (feeEl) feeEl.value = uiState.fee;
        if (taxEl) taxEl.value = uiState.tax;
        updateLivePreviewDOM();
      }
    });

    modalRoot.querySelector('#btn-pick-trade-date')?.addEventListener('click', () => {
      syncFormInputs();
      openDatePicker({
        id: 'pick-stock-trade-date',
        title: '選擇交易日期',
        selectedDateStr: uiState.date,
        onSelect: (dateStr) => {
          uiState.date = dateStr;
          renderContent();
        }
      });
    });

    ['#st-shares', '#st-price', '#st-fee-discount', '#st-tax-rate'].forEach((sel) => {
      modalRoot.querySelector(sel)?.addEventListener('input', () => {
        syncFormInputs();
        computeAutoFeeAndTax();
        const feeEl = modalRoot.querySelector('#st-fee');
        const taxEl = modalRoot.querySelector('#st-tax');
        if (feeEl) feeEl.value = uiState.fee;
        if (taxEl) taxEl.value = uiState.tax;
        updatePresetButtonsHighlight();
        updateLivePreviewDOM();
      });
    });

    ['#st-fee', '#st-tax'].forEach((sel) => {
      modalRoot.querySelector(sel)?.addEventListener('input', () => {
        syncFormInputs();
        updateLivePreviewDOM();
      });
    });

    modalRoot.querySelector('#stock-trade-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      syncFormInputs();

      const errorEl = modalRoot.querySelector('#st-error');
      const symbol = uiState.symbol;
      const shares = Math.max(1, Math.floor(Number(uiState.shares) || 0));
      const price = Math.round((Number(uiState.price) || 0) * 100) / 100;
      const fee = Math.max(0, Math.floor(Number(uiState.fee) || 0));
      const isBuy = uiState.tradeType === 'buy';
      const tax = isBuy ? 0 : Math.max(0, Math.floor(Number(uiState.tax) || 0));
      const parsedTaxRate =
        uiState.taxRate !== '' && !Number.isNaN(Number(uiState.taxRate))
          ? Math.max(0, Number(uiState.taxRate))
          : inferTaxRateFromSymbol(symbol);

      if (!freshAccount.settlementAccountId) {
        errorEl.textContent = '請先點擊上方鉛筆圖示綁定一個交割銀行帳戶';
        errorEl.classList.remove('hidden');
        return;
      }

      if (!isBuy) {
        const held = portfolio.holdings.find((h) => h.symbol === symbol)?.shares || 0;
        if (shares > held) {
          errorEl.textContent = `庫存股數不足（目前持有 ${symbol} 共 ${held} 股）`;
          errorEl.classList.remove('hidden');
          return;
        }
      }

      const principal = Math.max(1, Math.floor(Math.round(shares * price * 100) / 100));
      const settlementDate = addTradingDays(uiState.date, 2);
      const slashDate = uiState.date.replace(/-/g, '/');
      const nowTs = Date.now();
      const linkedTxIds = [];

      // 1. 在交割戶新增 T+2 股款預記紀錄
      const principalTxId = `tx_st_${nowTs}_1`;
      linkedTxIds.push(principalTxId);
      await addRecord(STORES.TRANSACTIONS, {
        id: principalTxId,
        type: isBuy ? 'expense' : 'income',
        amount: principal,
        myAmount: principal,
        otherAmount: 0,
        name: `${slashDate} ${isBuy ? '買入' : '賣出'} ${shares} 股 ${symbol}`,
        date: settlementDate,
        accountId: freshAccount.settlementAccountId,
        toAccountId: null,
        categoryId: isBuy ? 'cat_sys_stock_buy' : 'cat_sys_stock_sell',
        note: `${isBuy ? '買入' : '賣出'}金額 ${formatCurrency(principal)} (成交價 ${price})`,
        excludeFromStats: true,
        createdAt: nowTs
      });

      // 2. 若手續費 > 0，在交割戶新增手續費紀錄
      if (fee > 0) {
        const feeTxId = `tx_st_${nowTs}_2`;
        linkedTxIds.push(feeTxId);
        await addRecord(STORES.TRANSACTIONS, {
          id: feeTxId,
          type: 'expense',
          amount: fee,
          myAmount: fee,
          otherAmount: 0,
          name: `${slashDate} ${isBuy ? '買入' : '賣出'} ${symbol} 手續費`,
          date: settlementDate,
          accountId: freshAccount.settlementAccountId,
          toAccountId: null,
          categoryId: 'cat_sys_stock_fee',
          note: `${shares} 股手續費`,
          excludeFromStats: true,
          createdAt: nowTs + 1
        });
      }

      // 3. 若證交稅 > 0，在交割戶新增證交稅紀錄
      if (tax > 0) {
        const taxTxId = `tx_st_${nowTs}_3`;
        linkedTxIds.push(taxTxId);
        await addRecord(STORES.TRANSACTIONS, {
          id: taxTxId,
          type: 'expense',
          amount: tax,
          myAmount: tax,
          otherAmount: 0,
          name: `${slashDate} 賣出 ${symbol} 證交稅`,
          date: settlementDate,
          accountId: freshAccount.settlementAccountId,
          toAccountId: null,
          categoryId: 'cat_sys_stock_tax',
          note: `${shares} 股證交稅 (稅率 ${parsedTaxRate}%)`,
          excludeFromStats: true,
          createdAt: nowTs + 2
        });
      }

      // 4. 新增股票交易紀錄（買入與賣出皆儲存該標的的 taxRate 供逐筆計算現值使用）
      await addRecord(STORES.STOCK_TRADES, {
        id: `st_${nowTs}`,
        accountId: freshAccount.id,
        type: uiState.tradeType,
        date: uiState.date,
        settlementDate,
        symbol,
        shares,
        price,
        feeDiscount: Number(uiState.feeDiscount) || 10,
        taxRate: parsedTaxRate,
        fee,
        tax,
        linkedTxIds,
        createdAt: nowTs
      });

      uiState.symbol = '';
      uiState.shares = '';
      uiState.price = '';
      uiState.fee = '';
      uiState.tax = 0;
      uiState.subTab = 'holdings';

      await refreshData();
      renderContent();

      syncDailyStockPrices(symbol).then(() => renderContent()).catch(() => {});
    });

    modalRoot.querySelectorAll('[data-del-trade]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tradeId = btn.dataset.delTrade;
        const targetTrade = store.stockTrades.find((t) => t.id === tradeId);
        if (!targetTrade) return;

        openConfirmModal({
          id: 'del-stock-trade-confirm',
          title: '刪除股票交易紀錄',
          message: `確定要刪除「${targetTrade.date} ${targetTrade.type === 'buy' ? '買入' : '賣出'} ${targetTrade.shares} 股 ${targetTrade.symbol}」嗎？這會一併刪除交割戶上連動的股款、手續費與證交稅紀錄。`,
          confirmText: '確定刪除',
          cancelText: '取消',
          isDanger: true,
          onConfirm: async () => {
            if (Array.isArray(targetTrade.linkedTxIds)) {
              for (const txId of targetTrade.linkedTxIds) {
                await deleteRecord(STORES.TRANSACTIONS, txId);
              }
            }
            await deleteRecord(STORES.STOCK_TRADES, targetTrade.id);
            await refreshData();
            renderContent();
          }
        });
      });
    });
  }

  renderContent();
}