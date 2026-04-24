import { useRef, useCallback } from 'react';

// Returns pointer handlers that distinguish a tap from a press-and-hold.
// - Short press → onTap
// - Press past `delay` ms → onLongPress (with haptic if available)
// - Pointer movement past `moveThreshold` px cancels (so scrolling doesn't
//   trigger a long press)
// - Press inside a child <button> bails entirely so inner controls (delete,
//   the `+` on repeatables) keep their own click semantics.
export function useLongPress(onLongPress, onTap, { delay = 500, moveThreshold = 8 } = {}) {
  const timerRef = useRef(null);
  const triggeredRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const skipRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback((e) => {
    // Bail when the press starts on an interactive child (button, input, etc.)
    if (e.target.closest('button, input, textarea, select, a')) {
      skipRef.current = true;
      return;
    }
    skipRef.current = false;
    triggeredRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      timerRef.current = null;
      if (navigator.vibrate) navigator.vibrate(15);
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay]);

  const onPointerMove = useCallback((e) => {
    if (skipRef.current || !timerRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.hypot(dx, dy) > moveThreshold) clear();
  }, [moveThreshold, clear]);

  const onPointerUp = useCallback((e) => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    const wasArmed = !!timerRef.current;
    clear();
    if (!triggeredRef.current && wasArmed) {
      onTap?.(e);
    }
  }, [onTap, clear]);

  const onPointerCancel = useCallback(() => {
    skipRef.current = false;
    clear();
  }, [clear]);

  const onPointerLeave = clear;
  // iOS Safari long-press can pop a magnifier / context menu; suppress.
  const onContextMenu = useCallback((e) => e.preventDefault(), []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    onContextMenu,
  };
}
