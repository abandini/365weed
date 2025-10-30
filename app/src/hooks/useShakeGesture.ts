import { useEffect, useRef } from 'react';

interface ShakeOptions {
  threshold?: number;
  timeout?: number;
}

export function useShakeGesture(callback: () => void, options: ShakeOptions = {}) {
  const { threshold = 15, timeout = 1000 } = options;
  const lastShakeTime = useRef(0);

  useEffect(() => {
    // Check if device motion is supported
    if (!window.DeviceMotionEvent) {
      return;
    }

    let lastX = 0, lastY = 0, lastZ = 0;

    function handleMotion(event: DeviceMotionEvent) {
      const current = event.accelerationIncludingGravity;
      if (!current) return;

      const x = current.x || 0;
      const y = current.y || 0;
      const z = current.z || 0;

      // Calculate change in acceleration
      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      // Check if shake threshold is exceeded
      if (deltaX > threshold || deltaY > threshold || deltaZ > threshold) {
        const now = Date.now();

        // Prevent rapid fire (only trigger once per timeout period)
        if (now - lastShakeTime.current > timeout) {
          lastShakeTime.current = now;
          callback();
        }
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    }

    // Request permission on iOS 13+
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      // Non-iOS or older iOS
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [callback, threshold, timeout]);
}
