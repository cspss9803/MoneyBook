import { initDB } from './db/initDB.js';
import { store } from './state/store.js';
import { refreshData } from './state/refreshData.js';
import { initBackHandler } from './ui/initBackHandler.js';
import { applyTheme } from './ui/applyTheme.js';

function hideLoader() {
  const loader = document.getElementById('app-loader');
  if (!loader) return;
  requestAnimationFrame(() => {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 200);
  });
}

async function bootstrap() {
  try {
    applyTheme(store.theme);
    initBackHandler();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    await initDB();
    await refreshData();
  } catch (error) {
    console.error('初始化記帳本失敗:', error);
  } finally {
    hideLoader();
  }
}

bootstrap();