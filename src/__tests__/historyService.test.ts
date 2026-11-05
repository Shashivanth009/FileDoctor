import { describe, it, expect } from 'vitest';
import { FILE_EXPIRATION_MS } from '../services/historyService';

describe('historyService and retention policy', () => {
  it('enforces exactly 1-hour expiration limit', () => {
    expect(FILE_EXPIRATION_MS).toBe(60 * 60 * 1000);
    expect(FILE_EXPIRATION_MS).toBe(3600000); // 3,600,000 ms
  });

  it('calculates proper expiration timestamps for files', () => {
    const now = 1700000000000;
    const expiresAt = now + FILE_EXPIRATION_MS;
    expect(expiresAt - now).toBe(3600000);
    expect(expiresAt).toBe(1700003600000);
  });

  it('identifies expired files after 1 hour', () => {
    const timestamp = 1700000000000;
    const expiresAt = timestamp + FILE_EXPIRATION_MS;

    const after30Mins = timestamp + 30 * 60 * 1000;
    expect(after30Mins >= expiresAt).toBe(false);

    const after59Mins = timestamp + 59 * 60 * 1000;
    expect(after59Mins >= expiresAt).toBe(false);

    const after60Mins = timestamp + 60 * 60 * 1000;
    expect(after60Mins >= expiresAt).toBe(true);

    const after2Hours = timestamp + 120 * 60 * 1000;
    expect(after2Hours >= expiresAt).toBe(true);
  });
});

