import { ADS_SLOT_DEFINITIONS } from './adsConfig';

export function getAdSlots() {
  return ADS_SLOT_DEFINITIONS.map((slot) => ({ ...slot }));
}

export function shouldShowAdPlaceholders({
  isDev = import.meta.env.DEV,
  mode = import.meta.env.MODE,
  forcePlaceholders = import.meta.env.VITE_ADS_UI_PLACEHOLDERS === 'true',
} = {}) {
  return Boolean(isDev || mode === 'test' || forcePlaceholders);
}

export function isAdSlotVisible(slot, options = {}) {
  if (!slot) {
    return false;
  }

  if (slot.enabled) {
    return true;
  }

  return shouldShowAdPlaceholders(options);
}

export function getAdSlotById(slotId) {
  const slot = ADS_SLOT_DEFINITIONS.find((currentSlot) => currentSlot.id === slotId);
  return slot ? { ...slot } : null;
}

export function getEnabledAdSlots() {
  return getAdSlots().filter((slot) => slot.enabled);
}

export function getAdSlotsByRoute(routeName) {
  return getAdSlots().filter((slot) => slot.routeName === routeName);
}

export function hasVisibleAdSlots(options = {}) {
  return getAdSlots().some((slot) => isAdSlotVisible(slot, options));
}
