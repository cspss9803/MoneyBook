import { store } from '../state/store.js';
import { setState } from '../state/setState.js';
import { renderTransactionModal } from './renderTransactionModal.js';

export function renderBottomNav(container) {
    const tabs = [
        {
            id: 'transactions',
            label: '明細',
            svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>'
        },
        {
            id: 'accounts',
            label: '帳戶',
            svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>'
        },
        { 
            id: 'add', 
            isAction: true 
        },
        {
            id: 'stats',
            label: '統計',
            svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>'
        },
        {
            id: 'settings',
            label: '設定',
            svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
        }
    ];

    container.innerHTML = `
        <div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 h-16 grid grid-cols-5 items-center z-20">
            ${tabs
                .map((tab) => {
                    if (tab.isAction) {
                        return `
                            <button id="btn-open-add-tx" type="button" class="mx-auto w-12 h-10 bg-slate-900 text-white rounded-md flex items-center justify-center active:bg-slate-700">
                                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                        `;
                    }
                    const isActive = store.currentTab === tab.id;
                    const colorClass = isActive ? 'text-slate-900 font-semibold' : 'text-slate-400 font-normal';
                    return `
                        <button type="button" data-tab="${tab.id}" class="flex flex-col items-center justify-center h-full space-y-1 ${colorClass}">
                            <span class="w-5 h-5 [&>svg]:w-full [&>svg]:h-full">${tab.svg}</span>
                            <span class="text-xs">${tab.label}</span>
                        </button>
                    `;
                }).join('')
            }
        </div>
    `;

    container.querySelectorAll('button[data-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
            setState({ currentTab: btn.dataset.tab });
        });
    });

    const addBtn = container.querySelector('#btn-open-add-tx');
    if (addBtn) {
        addBtn.addEventListener('click', () => renderTransactionModal(null));
    }
}