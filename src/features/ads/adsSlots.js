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

export function isAdSlotAllowedForRoute(slot, routeName) {
  if (!slot) {
    return false;
  }

  if (!Array.isArray(slot.routeNames) || slot.routeNames.length === 0) {
    return true;
  }

  return slot.routeNames.includes(routeName);
}

export function isAdSlotVisible(slot, { routeName, providerEnabled = true, ...options } = {}) {
  if (!slot || !isAdSlotAllowedForRoute(slot, routeName)) {
    return false;
  }

  if (slot.enabled && providerEnabled) {
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
  return getAdSlots().filter((slot) => isAdSlotAllowedForRoute(slot, routeName));
}

export function hasVisibleAdSlotsForRoute(routeName, options = {}) {
  return getAdSlotsByRoute(routeName).some((slot) => isAdSlotVisible(slot, { routeName, ...options }));
}
