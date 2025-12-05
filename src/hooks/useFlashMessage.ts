import { useState, useEffect, useCallback } from 'react';
import type { FlashMessage } from '@/types/pos';

export function useFlashMessage() {
  const [flash, setFlash] = useState<FlashMessage | null>(null);

  // Auto-clear flash message after 4 seconds
  useEffect(() => {
    if (!flash) return;

    const timeout = window.setTimeout(() => {
      setFlash(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [flash]);

  const triggerFlash = useCallback((type: FlashMessage['type'], text: string) => {
    setFlash({ type, text });
  }, []);

  const clearFlash = useCallback(() => {
    setFlash(null);
  }, []);

  const success = useCallback((text: string) => {
    triggerFlash('success', text);
  }, [triggerFlash]);

  const error = useCallback((text: string) => {
    triggerFlash('error', text);
  }, [triggerFlash]);

  const info = useCallback((text: string) => {
    triggerFlash('info', text);
  }, [triggerFlash]);

  return {
    flash,
    triggerFlash,
    clearFlash,
    success,
    error,
    info,
  };
}