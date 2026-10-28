import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock crypto.getRandomValues for nanoid
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: <T extends ArrayBufferView>(arr: T): T => {
      const uint8 = new Uint8Array(arr.buffer as ArrayBuffer);
      for (let i = 0; i < uint8.length; i++) uint8[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  },
  writable: true,
});
