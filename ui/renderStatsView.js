import { STATS_PERIODS } from '../config/constants.js';
import { store } from '../state/store.js';
import { setState } from '../state/setState.js';
import { filterTransactionsByDate } from '../domain/filterTransactionsByDate.js';
import { aggregateStatsByCategory } from '../domain/aggregateStatsByCategory.js';
import { formatCurrency } from '../domain/formatCurrency.js';
import { renderIcon } from './renderIcon.js';
import { drawStatsChart } from './drawStatsChart.js';

export function renderStatsView(container) {
    const { statsFilter, transactions, categories } = store;
    const availableCategories = categories.filter((c) => c.type === statsFilter.type);

    // null 代表全選所有該類型的類別
    const activeCategoryIds =
        statsFilter.selectedCategoryIds === null
        ? availableCategories.map((c) => c.id)
        : statsFilter.selectedCategoryIds;

    const dateFilteredTx = filterTransactionsByDate(transactions, statsFilter);
    const { totalAmount, items } = aggregateStatsByCategory(dateFilteredTx, categories, {
        ...statsFilter,
        selectedCategoryIds: activeCategoryIds
    });

    const periodTabsHtml = STATS_PERIODS.map((p) => {
        const active = statsFilter.period === p.id;
        return `
            <button type="button" data-period="${p.id}" class="px-3 py-1.5 text-xs font-semibold rounded-md shrink-0 border ${
                active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }">${p.label}</button>
        `;
    }).join('');

    const dateControlsHtml =
        statsFilter.period === 'custom'
        ? `
            <div class="grid grid-cols-2 gap-2">
            <div>
                <label class="block text-[11px] text-slate-500 mb-1">起始日期</label>
                <input id="stats-custom-start" type="date" value="${statsFilter.customStart}" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs" />
            </div>
            <div>
                <label class="block text-[11px] text-slate-500 mb-1">結束日期</label>
                <input id="stats-custom-end" type="date" value="${statsFilter.customEnd}" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs" />
            </div>
            </div>
        `
        : `
            <div class="flex items-center justify-between">
            <span class="text-xs text-slate-600">統計基準日（依此日推算所選週/月/季/年）</span>
            <input id="stats-anchor-date" type="date" value="${statsFilter.anchorDate}" class="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs" />
            </div>
        `;

    const categoryChipsHtml = availableCategories
        .map((cat) => {
        const checked = activeCategoryIds.includes(cat.id);
        return `
            <button type="button" data-toggle-cat="${cat.id}" class="px-2.5 py-1 rounded border text-xs flex items-center space-x-1.5 ${
            checked
                ? 'bg-slate-900 text-white border-slate-900 font-medium'
                : 'bg-white text-slate-400 border-slate-200'
            }">
            <span class="w-2 h-2 rounded-full" style="background-color: ${cat.color}"></span>
            <span>${cat.name}</span>
            </button>
        `;
        })
        .join('');

    const detailListHtml = items
        .map((item) => {
            return `
                <div class="p-3 flex items-center justify-between">
                <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-8 h-8 rounded flex items-center justify-center text-white shrink-0" style="background-color: ${item.color}">
                    ${renderIcon(item.iconType, item.iconData, 'w-4 h-4')}
                    </div>
                    <div class="min-w-0">
                    <div class="text-sm font-medium text-slate-900 truncate">${item.name}</div>
                    <div class="text-xs text-slate-400">${item.count} 筆 · 佔比 ${item.percentage}%</div>
                    </div>
                </div>
                <div class="text-sm font-semibold text-slate-900 shrink-0 ml-2">
                    ${formatCurrency(item.amount)}
                </div>
                </div>
            `;
        })
        .join('');

    container.innerHTML = `
        <header class="mb-4 space-y-3">
        <div class="flex items-center justify-between">
            <h1 class="text-lg font-bold text-slate-900">統計分析</h1>
            <!-- 支出 / 收入 切換 -->
            <div class="inline-flex bg-slate-200 p-0.5 rounded-md">
            <button type="button" data-stats-type="expense" class="px-3 py-1 text-xs font-semibold rounded ${
                statsFilter.type === 'expense' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }">支出</button>
            <button type="button" data-stats-type="income" class="px-3 py-1 text-xs font-semibold rounded ${
                statsFilter.type === 'income' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }">收入</button>
            </div>
        </div>

        <!-- 區間選擇列 -->
        <div class="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1">
            ${periodTabsHtml}
        </div>

        <!-- 日期選擇器 -->
        <div class="bg-white border border-slate-200 rounded-md p-3">
            ${dateControlsHtml}
        </div>
        </header>

        <!-- 圖表區 -->
        <section class="bg-white border border-slate-200 rounded-md p-4 mb-3">
        ${drawStatsChart(items, totalAmount)}
        </section>

        <!-- 類別篩選與排除控制 -->
        <section class="bg-white border border-slate-200 rounded-md p-3 mb-3 space-y-2.5">
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-700">勾選要納入統計的類別</span>
            <div class="space-x-2">
            <button id="btn-cat-all" type="button" class="text-xs text-slate-600 underline">全選</button>
            <button id="btn-cat-none" type="button" class="text-xs text-slate-600 underline">全不選</button>
            </div>
        </div>
        <div class="flex flex-wrap gap-1.5">
            ${categoryChipsHtml}
        </div>
        <label class="flex items-center space-x-2 pt-2 border-t border-slate-100 cursor-pointer">
            <input id="stats-include-excluded" type="checkbox" ${statsFilter.includeExcluded ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-slate-900" />
            <span class="text-xs text-slate-600">將單筆標記為「不計統計」的紀錄也納入計算</span>
        </label>
        </section>

        <!-- 各類別金額排行明細 -->
        ${
        items.length > 0
            ? `
        <section class="bg-white border border-slate-200 rounded-md overflow-hidden">
            <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
            分類統計明細
            </div>
            <div class="divide-y divide-slate-100">
            ${detailListHtml}
            </div>
        </section>
        `
            : ''
        }
    `;

    container.querySelectorAll('[data-stats-type]').forEach((btn) => {
        btn.addEventListener('click', () => {
            setState({
                statsFilter: {
                type: btn.dataset.statsType,
                selectedCategoryIds: null
                }
            });
        });
    });

    container.querySelectorAll('[data-period]').forEach((btn) => {
        btn.addEventListener('click', () => {
            setState({ statsFilter: { period: btn.dataset.period } });
        });
    });

    container.querySelector('#stats-anchor-date')?.addEventListener('change', (e) => {
        setState({ statsFilter: { anchorDate: e.target.value } });
    });

    container.querySelector('#stats-custom-start')?.addEventListener('change', (e) => {
        setState({ statsFilter: { customStart: e.target.value } });
    });

    container.querySelector('#stats-custom-end')?.addEventListener('change', (e) => {
        setState({ statsFilter: { customEnd: e.target.value } });
    });

    container.querySelectorAll('[data-toggle-cat]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const catId = btn.dataset.toggleCat;
            const nextIds = activeCategoryIds.includes(catId)
                ? activeCategoryIds.filter((id) => id !== catId)
                : [...activeCategoryIds, catId];
            setState({ statsFilter: { selectedCategoryIds: nextIds } });
        });
    });

    container.querySelector('#btn-cat-all')?.addEventListener('click', () => {
        setState({ statsFilter: { selectedCategoryIds: null } });
    });

    container.querySelector('#btn-cat-none')?.addEventListener('click', () => {
        setState({ statsFilter: { selectedCategoryIds: [] } });
    });

    container.querySelector('#stats-include-excluded')?.addEventListener('change', (e) => {
        setState({ statsFilter: { includeExcluded: e.target.checked } });
    });
}