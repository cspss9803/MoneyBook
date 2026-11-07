import { store } from '../state/store.js';

export function popOverlay(id) {
  store.overlayStack = store.overlayStack.filter((item) => item.id !== id);
}