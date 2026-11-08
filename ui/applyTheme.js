import { store } from '../state/store.js';

export function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  store.theme = nextTheme;
  localStorage.setItem('mb_theme', nextTheme);

  const root = document.documentElement;
  if (nextTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', nextTheme === 'dark' ? '#020617' : '#0f172a');
  }
}