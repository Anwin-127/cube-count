import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that manages the debug overlay visibility.
 *
 * Toggle: F2 key
 *
 * The overlay is only available in development builds.
 * In production, this hook always returns false.
 */
export function useDebugOverlay(): boolean {
  const [visible, setVisible] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F2') {
      e.preventDefault();
      setVisible((v) => !v);
    }
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Always hidden in production
  if (!import.meta.env.DEV) return false;

  return visible;
}
