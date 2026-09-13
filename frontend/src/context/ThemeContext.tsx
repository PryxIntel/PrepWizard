import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light' | 'neon' | 'emerald';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  badge: string;
  iconColor: string;
  bgPreview: string;
  accentPreview: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'dark',
    name: 'Midnight Dark',
    badge: 'Pro',
    iconColor: '#818cf8',
    bgPreview: '#020617',
    accentPreview: '#6366f1',
  },
  {
    id: 'light',
    name: 'Crisp Daylight',
    badge: 'Clean',
    iconColor: '#eab308',
    bgPreview: '#f8fafc',
    accentPreview: '#4f46e5',
  },
  {
    id: 'neon',
    name: 'Cyberpunk Neon',
    badge: 'Glow',
    iconColor: '#22d3ee',
    bgPreview: '#050512',
    accentPreview: '#06b6d4',
  },
  {
    id: 'emerald',
    name: 'Matrix Forest',
    badge: 'Zen',
    iconColor: '#34d399',
    bgPreview: '#021812',
    accentPreview: '#10b981',
  },
];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('prepwizard_theme') as ThemeMode;
    if (saved && ['dark', 'light', 'neon', 'emerald'].includes(saved)) {
      return saved;
    }
    return 'dark';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('prepwizard_theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: AVAILABLE_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
