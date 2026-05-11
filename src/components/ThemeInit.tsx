'use client';

import { useEffect } from 'react';

export default function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem('dalsaegim-theme');
    if (saved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  return null;
}
