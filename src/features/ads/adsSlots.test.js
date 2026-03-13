import { describe, expect, it } from 'vitest';
import { getAdSlotsByRoute, hasVisibleAdSlotsForRoute, isAdSlotVisible, shouldShowAdPlaceholders } from './adsSlots';

describe('adsSlots visibility helpers', () => {
  it('hides placeholders in production by default', () => {
    expect(shouldShowAdPlaceholders({ isDev: false, mode: 'production', forcePlaceholders: false })).toBe(false);
    expect(hasVisibleAdSlotsForRoute('home', { isDev: false, mode: 'production', forcePlaceholders: false })).toBe(false);
  });

  it('shows placeholders in test mode on eligible routes only', () => {
    expect(shouldShowAdPlaceholders({ isDev: false, mode: 'test', forcePlaceholders: false })).toBe(true);
    expect(hasVisibleAdSlotsForRoute('home', { isDev: false, mode: 'test', forcePlaceholders: false })).toBe(true);
    expect(hasVisibleAdSlotsForRoute('math-multiplications', { isDev: false, mode: 'test', forcePlaceholders: false })).toBe(false);
  });

  it('filters slots by eligible route', () => {
    expect(getAdSlotsByRoute('home')).toHaveLength(3);
    expect(getAdSlotsByRoute('math-hub')).toHaveLength(3);
    expect(getAdSlotsByRoute('math-multiplications')).toHaveLength(0);
  });

  it('always shows an enabled slot on an allowed route', () => {
    expect(
      isAdSlotVisible(
        { id: 'custom-slot', enabled: true, routeNames: ['home'] },
        { routeName: 'home', isDev: false, mode: 'production', forcePlaceholders: false }
      )
    ).toBe(true);
  });
});
