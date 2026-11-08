import { store } from '../state/store.js';
import { popOverlay } from './popOverlay.js';

export function openConfirmModal({
  id = 'confirm-modal',
  title = '確認操作',
  message = '',
  confirmText = '確定',
  cancelText = '取消',
  isDanger = false,
  lockBack = false,
  onConfirm = null,
  onCancel = null
}) {
  const existing = document.getElementById('confirm-modal-layer');
  if (existing) existing.remove();

  const layer = document.createElement('div');
  layer.id = 'confirm-modal-layer';
  layer.className = 'fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4';

  const confirmBtnClass = isDanger
    ? 'bg-rose-600 text-white active:bg-rose-700'
    : 'bg-slate-900 text-white active:bg-slate-700';

  layer.innerHTML = `
    <div id="confirm-dialog-box" class="bg-white w-full max-w-xs rounded-lg border border-slate-200 p-4 shadow-sm">
      <h3 class="text-sm font-bold text-slate-900 mb-1.5">${title}</h3>
      <p class="text-xs text-slate-600 leading-relaxed mb-4">${message}</p>
      <div class="grid grid-cols-2 gap-2">
        <button id="btn-confirm-cancel" type="button" class="py-2 px-3 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 bg-white active:bg-slate-100">
          ${cancelText}
        </button>
        <button id="btn-confirm-ok" type="button" class="py-2 px-3 rounded-md text-xs font-semibold ${confirmBtnClass}">
          ${confirmText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(layer);

  function closeConfirm() {
    layer.remove();
    popOverlay(id);
  }

  if (!Array.isArray(store.overlayStack)) {
    store.overlayStack = [];
  }
  store.overlayStack = store.overlayStack.filter((item) => item.id !== id);
  store.overlayStack.push({ id, closeFn: closeConfirm, locked: Boolean(lockBack) });

  layer.addEventListener('click', (e) => {
    if (e.target === layer && !lockBack) {
      closeConfirm();
      if (typeof onCancel === 'function') onCancel();
    }
  });

  layer.querySelector('#btn-confirm-cancel')?.addEventListener('click', () => {
    closeConfirm();
    if (typeof onCancel === 'function') onCancel();
  });

  layer.querySelector('#btn-confirm-ok')?.addEventListener('click', async () => {
    closeConfirm();
    if (typeof onConfirm === 'function') {
      await onConfirm();
    }
  });
}