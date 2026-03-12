export const GOOGLE_FC_CONSENT_VALUES = Object.freeze({
  GRANTED: 'CONSENT_MODE_GRANTED',
  DENIED: 'CONSENT_MODE_DENIED',
  UNKNOWN: 'CONSENT_MODE_UNKNOWN',
  NOT_APPLICABLE: 'CONSENT_MODE_NOT_APPLICABLE',
  NOT_CONFIGURED: 'CONSENT_MODE_NOT_CONFIGURED',
});

function normalizeGooglefcConsentValue(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return Object.values(GOOGLE_FC_CONSENT_VALUES).includes(normalized)
    ? normalized
    : GOOGLE_FC_CONSENT_VALUES.UNKNOWN;
}

function toGoogleConsentModeValue(value) {
  const normalized = normalizeGooglefcConsentValue(value);
  return normalized === GOOGLE_FC_CONSENT_VALUES.GRANTED ||
    normalized === GOOGLE_FC_CONSENT_VALUES.NOT_APPLICABLE ||
    normalized === GOOGLE_FC_CONSENT_VALUES.NOT_CONFIGURED
    ? 'granted'
    : 'denied';
}

export function mapGooglefcConsentModeValuesToGtag(values = {}) {
  return {
    ad_storage: toGoogleConsentModeValue(values.ad_storage),
    analytics_storage: toGoogleConsentModeValue(values.analytics_storage),
    ad_user_data: toGoogleConsentModeValue(values.ad_user_data),
    ad_personalization: toGoogleConsentModeValue(values.ad_personalization),
  };
}

export function canServeAdsFromGooglefcConsentMode(values = {}) {
  const googleConsent = mapGooglefcConsentModeValuesToGtag(values);
  return (
    googleConsent.ad_storage === 'granted' &&
    googleConsent.ad_user_data === 'granted' &&
    googleConsent.ad_personalization === 'granted'
  );
}

export function buildManagedCmpConsentSnapshot(values = {}) {
  const googleConsent = mapGooglefcConsentModeValuesToGtag(values);

  return {
    rawValues: {
      ad_storage: normalizeGooglefcConsentValue(values.ad_storage),
      analytics_storage: normalizeGooglefcConsentValue(values.analytics_storage),
      ad_user_data: normalizeGooglefcConsentValue(values.ad_user_data),
      ad_personalization: normalizeGooglefcConsentValue(values.ad_personalization),
    },
    googleConsent,
    adsAllowed: canServeAdsFromGooglefcConsentMode(values),
    analyticsAllowed: googleConsent.analytics_storage === 'granted',
  };
}
