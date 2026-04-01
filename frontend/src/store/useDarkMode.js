import { create } from 'zustand';

const getInitial = () => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const apply = (dark) => {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
};

const useDarkMode = create((set, get) => {
  const dark = getInitial();
  apply(dark);
  return {
    dark,
    toggle: () => {
      const next = !get().dark;
      apply(next);
      set({ dark: next });
    },
  };
});

export default useDarkMode;
