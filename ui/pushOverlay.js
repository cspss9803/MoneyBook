import { store } from '../state/store.js';

export function pushOverlay(id, closeFn) {
  if (!Array.isArray(store.overlayStack)) {
    store.overlayStack = [];
  }
  store.overlayStack = store.overlayStack.filter((item) => item.id !== id);
  store.overlayStack.push({ id, closeFn });
}