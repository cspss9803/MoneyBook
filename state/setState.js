import { store } from './store.js';
import { renderApp } from '../ui/renderApp.js';

export function setState(partialState) {
    if (partialState.statsFilter) {
        store.statsFilter = { ...store.statsFilter, ...partialState.statsFilter };
        delete partialState.statsFilter;
    }

    Object.assign(store, partialState);
    renderApp();
}