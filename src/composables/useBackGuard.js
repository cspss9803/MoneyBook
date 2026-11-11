import { useOverlayStore } from '../stores/useOverlayStore.js';

export function useBackGuard() {
  const overlayStore = useOverlayStore();
  let allowExit = false;
  let guardDepth = 0;
  const TARGET_DEPTH = 3;

  function replenishGuards() {
    if (allowExit) return;
    while (guardDepth < TARGET_DEPTH) {
      window.history.pushState({ mbGuard: true, depth: guardDepth + 1 }, '');
      guardDepth += 1;
    }
  }

  function initBackHandler() {
    window.history.replaceState({ mbRoot: true }, '');
    replenishGuards();

    const onUserGesture = () => {
      if (!allowExit) replenishGuards();
    };

    window.addEventListener('touchstart', onUserGesture, { passive: true });
    window.addEventListener('click', onUserGesture, { passive: true });

    window.addEventListener('popstate', () => {
      if (allowExit) {
        window.close();
        window.history.back();
        return;
      }

      guardDepth = Math.max(0, guardDepth - 1);
      replenishGuards();

      if (overlayStore.overlayStack.length > 0) {
        const topOverlay = overlayStore.overlayStack[overlayStore.overlayStack.length - 1];
        if (topOverlay.locked) return;
        overlayStore.overlayStack.pop();
        if (typeof topOverlay.closeFn === 'function') topOverlay.closeFn();
        return;
      }

      overlayStore.openConfirm({
        id: 'exit-app-confirm',
        title: '離開 MoneyBook',
        message: '確定要關閉並離開記帳本嗎？',
        confirmText: '確定離開',
        cancelText: '繼續使用',
        isDanger: true,
        lockBack: true,
        onCancel: () => replenishGuards(),
        onConfirm: () => {
          allowExit = true;
          window.close();
          window.history.back();
        }
      });
    });
  }

  return { initBackHandler };
}
