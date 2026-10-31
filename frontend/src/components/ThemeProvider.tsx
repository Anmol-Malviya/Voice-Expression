'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { fontSize, highContrast, theme, reducedMotion, initFromStorage } = useAppStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove('scale-normal', 'scale-large', 'scale-xlarge');
    root.classList.add(`scale-${fontSize}`);

    if (highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');

    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    if (reducedMotion) root.classList.add('reduced-motion');
    else root.classList.remove('reduced-motion');
  }, [fontSize, highContrast, theme, reducedMotion]);

  return <>{children}</>;
};

export default ThemeProvider;

