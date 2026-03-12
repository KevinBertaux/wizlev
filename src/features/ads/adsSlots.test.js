import { describe, expect, it } from 'vitest';
import { hasVisibleAdSlots, isAdSlotVisible, shouldShowAdPlaceholders } from './adsSlots';

describe('adsSlots visibility helpers', () => {
  it('hides placeholders in production by default', () => {
    expect(shouldShowAdPlaceholders({ isDev: false, mode: 'production', forcePlaceholders: false })).toBe(false);
    expect(hasVisibleAdSlots({ isDev: false, mode: 'production', forcePlaceholders: false })).toBe(false);
  });

  it('shows placeholders in test mode', () => {
    expect(shouldShowAdPlaceholders({ isDev: false, mode: 'test', forcePlaceholders: false })).toBe(true);
    expect(hasVisibleAdSlots({ isDev: false, mode: 'test', forcePlaceholders: false })).toBe(true);
  });

  it('always shows an enabled slot', () => {
    expect(
      isAdSlotVisible(
        { id: 'custom-slot', enabled: true },
        { isDev: false, mode: 'production', forcePlaceholders: false }
      )
    ).toBe(true);
  });
});
