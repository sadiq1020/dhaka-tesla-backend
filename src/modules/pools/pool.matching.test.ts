import { describe, it, expect } from 'vitest';
import { canPool } from './pool.matching.js';

describe('canPool – corridor matching', () => {
  it('Nusrat (Mohakhali) + Rafiq (Gulshan 1) from Banani → true (Corridor 1)', () => {
    expect(canPool('banani', ['mohakhali', 'gulshan-1'])).toBe(true);
  });

  it('Sajid (Rampura) + Sayed (Gulshan 2) from Banani → true (Corridor 1)', () => {
    expect(canPool('banani', ['rampura', 'gulshan-2'])).toBe(true);
  });

  it('Rampura + Uttara from Banani → false (no shared corridor)', () => {
    expect(canPool('banani', ['rampura', 'uttara'])).toBe(false);
  });

  it('Two identical destinations → true even if zone is not in any corridor', () => {
    // Dhanmondi is an endpoint in corridor 4. When both passengers have the
    // same destination the unique list has length 1, so canPool returns true
    // without corridor lookup.
    expect(canPool('farmgate', ['dhanmondi', 'dhanmondi'])).toBe(true);
  });

  it('Three destinations that all fit Corridor 1 → true', () => {
    // Nusrat → mohakhali, Rafiq → gulshan-1, Shirin → rampura
    expect(canPool('banani', ['mohakhali', 'gulshan-1', 'rampura'])).toBe(true);
  });

  it('Three destinations where one does not fit any shared corridor → false', () => {
    // uttara is only in Corridor 3; rampura and gulshan-1 are in Corridor 1
    expect(canPool('banani', ['mohakhali', 'gulshan-1', 'uttara'])).toBe(false);
  });

  it('Single destination list → always true', () => {
    expect(canPool('banani', ['rampura'])).toBe(true);
  });

  it('Empty destination list → true (edge case, no passengers to conflict)', () => {
    expect(canPool('banani', [])).toBe(true);
  });
});
