import '@testing-library/jest-dom';

// Mock IndexedDB (not available in jsdom)
import 'fake-indexeddb/auto';

// Mock crypto.getRandomValues for nanoid
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  },
});

// Suppress console.error noise from React in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('act(')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
