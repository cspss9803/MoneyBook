import { store } from '../state/store.js';
import { renderBottomNav } from './renderBottomNav.js';
import { renderTransactionList } from './renderTransactionList.js';
import { renderAccountView } from './renderAccountView.js';
import { renderStatsView } from './renderStatsView.js';
import { renderSettingsView } from './renderSettingsView.js';

export function renderApp() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.innerHTML = `
        <main id="view-container" class="p-4"></main>
        <nav id="nav-container"></nav>
    `;

    const viewContainer = document.getElementById('view-container');
    const navContainer = document.getElementById('nav-container');

    if (store.currentTab === 'transactions') {
        renderTransactionList(viewContainer);
    } else if (store.currentTab === 'accounts') {
        renderAccountView(viewContainer);
    } else if (store.currentTab === 'stats') {
        renderStatsView(viewContainer);
    } else if (store.currentTab === 'settings') {
        renderSettingsView(viewContainer);
    }

    renderBottomNav(navContainer);
}