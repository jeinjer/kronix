import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isUserPreference, setIsUserPreference] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('tommasys-theme'));
  });

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tommasys-theme');
      if (saved) return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }

    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (isUserPreference) {
      localStorage.setItem('tommasys-theme', theme);
    } else {
      localStorage.removeItem('tommasys-theme');
    }

  }, [theme, isUserPreference]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (!isUserPreference) setTheme(e.matches ? 'dark' : 'light');
    };

    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, [isUserPreference]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    setIsUserPreference(true);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};