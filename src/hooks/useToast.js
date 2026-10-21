import { useRef, useState } from 'react';

// Share one small success/error message pattern between pages and reusable cards.
export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = (message, type = 'success') => {
    setToast({ message, type });
    // Cancel the old timer so a newer message is not dismissed too early.
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3600);
  };

  // Return both automatic and manual dismissal controls to the caller.
  return { toast, show, clear: () => setToast(null) };
}
