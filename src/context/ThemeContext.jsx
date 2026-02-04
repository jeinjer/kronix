import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Indicamos si el usuario ya expresó una preferencia explícita
  const [isUserPreference, setIsUserPreference] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('tommasys-theme'));
  });

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tommasys-theme');
      if (saved) return saved;

      // Si no hay preferencia guardada, usamos la preferencia del sistema
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

    // Guardamos la preferencia SOLO si fue elegida por el usuario (toggle)
    if (isUserPreference) {
      localStorage.setItem('tommasys-theme', theme);
    } else {
      localStorage.removeItem('tommasys-theme');
    }

    // Depuración rápida: mostrar la clase actual en <html>
    // (puedes quitar este console.log cuando todo esté estable)
    console.log('html.className =', root.className);
  }, [theme, isUserPreference]);

  // Escuchamos cambios en la preferencia del sistema, pero solo si el usuario
  // no escogió manualmente un tema (es decir, respetamos elección del usuario)
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