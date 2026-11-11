import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import App from './App.vue';

import { initDB } from './db/initDB.js';
import { useLedgerStore } from './stores/useLedgerStore.js';
import { useTheme } from './composables/useTheme.js';
import { useBackGuard } from './composables/useBackGuard.js';

function hideLoader() {
  const loader = document.getElementById('app-loader');
  if (!loader) return;
  requestAnimationFrame(() => {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 200);
  });
}

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);

  const ledgerStore = useLedgerStore();
  const { currentTheme, applyTheme } = useTheme();
  const { initBackHandler } = useBackGuard();

  try {
    applyTheme(currentTheme.value);
    initBackHandler();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    await initDB();
    await ledgerStore.refreshData();
    app.mount('#app');
  } catch (error) {
    console.error('啟動失敗:', error);
  } finally {
    hideLoader();
    ledgerStore.syncPrices().catch((err) => {
      console.warn('背景股價同步略過:', err);
    });
  }
}

bootstrap();
