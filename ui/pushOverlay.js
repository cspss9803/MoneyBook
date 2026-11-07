import { store } from '../state/store.js';

export function pushOverlay(id, closeFn) {
  store.overlayStack = store.overlayStack.filter((item) => item.id !== id);
  store.overlayStack.push({ id, closeFn });
}