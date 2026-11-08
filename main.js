import { initDB } from './db/initDB.js';
import { store } from './state/store.js';
import { refreshData } from './state/refreshData.js';
import { initBackHandler } from './ui/initBackHandler.js';
import { applyTheme } from './ui/applyTheme.js';
import { syncDailyStockPrices } from './domain/syncDailyStockPrices.js';

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
    // 畫面顯示後於背景執行每日一次收盤價同步，不卡頓首屏開啟速度
    syncDailyStockPrices().catch((err) => {
      console.warn('背景更新股價失敗:', err);
    });
  }
}

bootstrap();