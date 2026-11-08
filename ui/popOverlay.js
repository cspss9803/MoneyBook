import { store } from '../state/store.js';

export function popOverlay(id) {
  if (!Array.isArray(store.overlayStack)) {
    store.overlayStack = [];
    return;
  }
  store.overlayStack = store.overlayStack.filter((item) => item.id !== id);
}