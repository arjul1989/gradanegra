'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const savedTheme = localStorage.getItem('theme');
    
    if (!savedTheme) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      setTheme(savedTheme as 'light' | 'dark');
      
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-24 right-6 md:bottom-6 z-50 w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 group"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined text-xl text-slate-700 dark:text-yellow-400 group-hover:scale-110 transition-transform">
        {theme === 'dark' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
}
