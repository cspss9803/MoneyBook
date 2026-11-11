import { ref } from 'vue';

const currentTheme = ref(localStorage.getItem('mb_theme') === 'dark' ? 'dark' : 'light');

export function useTheme() {
  function applyTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    currentTheme.value = nextTheme;
    localStorage.setItem('mb_theme', nextTheme);

    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', nextTheme === 'dark' ? '#020617' : '#0f172a');
    }
  }

  return { currentTheme, applyTheme };
}
