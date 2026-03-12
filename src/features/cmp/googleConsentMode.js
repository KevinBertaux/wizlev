export const GOOGLE_FC_CONSENT_MODE_STATUS = Object.freeze({
  UNKNOWN: 0,
  GRANTED: 1,
  DENIED: 2,
  NOT_APPLICABLE: 3,
  NOT_CONFIGURED: 4,
});

export const GOOGLE_FC_CONSENT_MODE_FIELDS = Object.freeze({
  ad_storage: 'adStoragePurposeConsentStatus',
  ad_user_data: 'adUserDataPurposeConsentStatus',
  ad_personalization: 'adPersonalizationPurposeConsentStatus',
  analytics_storage: 'analyticsStoragePurposeConsentStatus',
});

const VALID_GOOGLE_FC_STATUSES = new Set(Object.values(GOOGLE_FC_CONSENT_MODE_STATUS));

function normalizeGooglefcConsentStatus(value) {
  const normalized = Number(value);
  return VALID_GOOGLE_FC_STATUSES.has(normalized)
    ? normalized
    : GOOGLE_FC_CONSENT_MODE_STATUS.UNKNOWN;
}

function isGooglefcGrantedStatus(value) {
  const normalized = normalizeGooglefcConsentStatus(value);
  return (
    normalized === GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED ||
    normalized === GOOGLE_FC_CONSENT_MODE_STATUS.NOT_APPLICABLE ||
    normalized === GOOGLE_FC_CONSENT_MODE_STATUS.NOT_CONFIGURED
  );
}

function toGoogleConsentModeValue(value) {
  return isGooglefcGrantedStatus(value) ? 'granted' : 'denied';
}

export function normalizeGooglefcConsentModeValues(values = {}) {
  return {
    ad_storage: normalizeGooglefcConsentStatus(values[GOOGLE_FC_CONSENT_MODE_FIELDS.ad_storage]),
    ad_user_data: normalizeGooglefcConsentStatus(values[GOOGLE_FC_CONSENT_MODE_FIELDS.ad_user_data]),
    ad_personalization: normalizeGooglefcConsentStatus(values[GOOGLE_FC_CONSENT_MODE_FIELDS.ad_personalization]),
    analytics_storage: normalizeGooglefcConsentStatus(values[GOOGLE_FC_CONSENT_MODE_FIELDS.analytics_storage]),
  };
}

export function mapGooglefcConsentModeValuesToGtag(values = {}) {
  const normalizedValues = normalizeGooglefcConsentModeValues(values);

  return {
    ad_storage: toGoogleConsentModeValue(normalizedValues.ad_storage),
    analytics_storage: toGoogleConsentModeValue(normalizedValues.analytics_storage),
    ad_user_data: toGoogleConsentModeValue(normalizedValues.ad_user_data),
    ad_personalization: toGoogleConsentModeValue(normalizedValues.ad_personalization),
  };
}

export function canServeAdsFromGooglefcConsentMode(values = {}) {
  const normalizedValues = normalizeGooglefcConsentModeValues(values);
  return (
    isGooglefcGrantedStatus(normalizedValues.ad_storage) &&
    isGooglefcGrantedStatus(normalizedValues.ad_user_data) &&
    isGooglefcGrantedStatus(normalizedValues.ad_personalization)
  );
}

export function buildManagedCmpConsentSnapshot(values = {}) {
  const purposeStatuses = normalizeGooglefcConsentModeValues(values);
  const googleConsent = mapGooglefcConsentModeValuesToGtag(values);

  return {
    rawValues: {
      [GOOGLE_FC_CONSENT_MODE_FIELDS.ad_storage]: purposeStatuses.ad_storage,
      [GOOGLE_FC_CONSENT_MODE_FIELDS.ad_user_data]: purposeStatuses.ad_user_data,
      [GOOGLE_FC_CONSENT_MODE_FIELDS.ad_personalization]: purposeStatuses.ad_personalization,
      [GOOGLE_FC_CONSENT_MODE_FIELDS.analytics_storage]: purposeStatuses.analytics_storage,
    },
    purposeStatuses,
    googleConsent,
    adsAllowed: canServeAdsFromGooglefcConsentMode(values),
    analyticsAllowed: isGooglefcGrantedStatus(purposeStatuses.analytics_storage),
  };
}
