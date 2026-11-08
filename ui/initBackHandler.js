import { store } from '../state/store.js';
import { openConfirmModal } from './openConfirmModal.js';

export function initBackHandler() {
  let allowExit = false;
  let guardDepth = 0;
  const TARGET_DEPTH = 3;

  // 補齊歷史紀錄保護緩衝池 (在真實手勢中呼叫可獲得瀏覽器手勢憑證)
  const replenishGuards = () => {
    if (allowExit) return;
    while (guardDepth < TARGET_DEPTH) {
      window.history.pushState({ mbGuard: true, depth: guardDepth + 1 }, '');
      guardDepth += 1;
    }
  };

  // 初次載入先建立基底與緩衝
  window.history.replaceState({ mbRoot: true }, '');
  replenishGuards();

  // 只要使用者在畫面上有任何觸碰或點擊，自動在真實手勢內補滿保護點
  const onUserGesture = () => {
    if (!allowExit) {
      replenishGuards();
    }
  };

  window.addEventListener('touchstart', onUserGesture, { passive: true });
  window.addEventListener('click', onUserGesture, { passive: true });

  window.addEventListener('popstate', () => {
    // 若使用者已點選「確定離開」，持續往回退直到退開網頁/關閉 App
    if (allowExit) {
      window.close();
      window.history.back();
      return;
    }

    guardDepth = Math.max(0, guardDepth - 1);
    // 立即補回保護點
    replenishGuards();

    // 檢查目前是否有開啟的彈窗或抽屜
    if (Array.isArray(store.overlayStack) && store.overlayStack.length > 0) {
      const topOverlay = store.overlayStack[store.overlayStack.length - 1];

      // 若最上層是鎖定返回鍵的「離開確認框」，怎麼按返回都不關閉它，也不退出網頁
      if (topOverlay.locked) {
        return;
      }

      store.overlayStack.pop();
      if (typeof topOverlay.closeFn === 'function') {
        topOverlay.closeFn();
      }
      return;
    }

    // 若沒有開啟任何選單，跳出鎖定返回鍵的離開確認框
    openConfirmModal({
      id: 'exit-app-confirm',
      title: '離開 MoneyBook',
      message: '確定要關閉並離開記帳本嗎？',
      confirmText: '確定離開',
      cancelText: '繼續使用',
      isDanger: true,
      lockBack: true,
      onCancel: () => {
        replenishGuards();
      },
      onConfirm: () => {
        allowExit = true;
        window.close();
        window.history.back();
      }
    });
  });
}