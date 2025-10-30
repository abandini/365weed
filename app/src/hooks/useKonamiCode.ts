import { useEffect, useState } from 'react';

// Famous Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA'
];

export function useKonamiCode(callback: () => void) {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const newKeys = [...keys, event.code].slice(-KONAMI_CODE.length);
      setKeys(newKeys);

      // Check if the sequence matches
      if (newKeys.length === KONAMI_CODE.length) {
        const matches = newKeys.every((key, index) => key === KONAMI_CODE[index]);
        if (matches) {
          callback();
          setKeys([]); // Reset after successful activation
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keys, callback]);

  return keys;
}
