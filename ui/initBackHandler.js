import { store } from '../state/store.js';
import { openConfirmModal } from './openConfirmModal.js';

export function initBackHandler() {
  let allowExit = false;

  const pushGuardState = () => {
    if (!allowExit) {
      window.history.pushState({ mbGuard: true }, '');
    }
  };

  // 初次載入與首次觸控時寫入歷史紀錄保護點 (確保通過行動瀏覽器手勢驗證)
  pushGuardState();
  window.addEventListener(
    'pointerdown',
    () => {
      if (!window.history.state?.mbGuard) {
        pushGuardState();
      }
    },
    { once: true, passive: true }
  );

  window.addEventListener('popstate', () => {
    if (allowExit) return;

    // 立即補回保護點，防止連續按返回鍵跳出網頁
    pushGuardState();

    // 若目前有打開任何抽屜、選單或提示框，優先關閉最上層
    if (store.overlayStack.length > 0) {
      const topOverlay = store.overlayStack.pop();
      if (topOverlay && typeof topOverlay.closeFn === 'function') {
        topOverlay.closeFn();
      }
      return;
    }

    // 若沒有打開任何選單，跳出是否關閉網頁的確認框
    openConfirmModal({
      id: 'exit-app-confirm',
      title: '離開 MoneyBook',
      message: '確定要關閉並離開記帳本嗎？',
      confirmText: '確定離開',
      cancelText: '繼續使用',
      isDanger: true,
      onConfirm: () => {
        allowExit = true;
        window.close();
        window.history.go(-window.history.length);
      }
    });
  });
}