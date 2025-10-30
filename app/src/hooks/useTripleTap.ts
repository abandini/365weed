import { useEffect, useRef } from 'react';

export function useTripleTap(callback: () => void, elementRef: React.RefObject<HTMLElement>) {
  const tapCount = useRef(0);
  const tapTimer = useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    function handleClick() {
      tapCount.current++;

      // Clear existing timer
      if (tapTimer.current) {
        window.clearTimeout(tapTimer.current);
      }

      // Check if we hit 3 taps
      if (tapCount.current === 3) {
        tapCount.current = 0;
        callback();
        return;
      }

      // Reset tap count after 500ms of inactivity
      tapTimer.current = window.setTimeout(() => {
        tapCount.current = 0;
      }, 500);
    }

    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('click', handleClick);
      if (tapTimer.current) {
        window.clearTimeout(tapTimer.current);
      }
    };
  }, [callback, elementRef]);
}
