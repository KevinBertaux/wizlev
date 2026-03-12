import { describe, expect, it } from 'vitest';
import {
  GOOGLE_FC_CONSENT_MODE_STATUS,
  buildManagedCmpConsentSnapshot,
  canServeAdsFromGooglefcConsentMode,
  mapGooglefcConsentModeValuesToGtag,
  normalizeGooglefcConsentModeValues,
} from './googleConsentMode';

describe('googleConsentMode', () => {
  it('maps denied consent by default', () => {
    expect(mapGooglefcConsentModeValuesToGtag()).toEqual({
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('normalizes Googlefc consent mode enums from the official numeric fields', () => {
    expect(
      normalizeGooglefcConsentModeValues({
        adStoragePurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        adUserDataPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.DENIED,
        adPersonalizationPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.NOT_APPLICABLE,
        analyticsStoragePurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.NOT_CONFIGURED,
      })
    ).toEqual({
      ad_storage: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
      ad_user_data: GOOGLE_FC_CONSENT_MODE_STATUS.DENIED,
      ad_personalization: GOOGLE_FC_CONSENT_MODE_STATUS.NOT_APPLICABLE,
      analytics_storage: GOOGLE_FC_CONSENT_MODE_STATUS.NOT_CONFIGURED,
    });
  });

  it('treats not applicable and not configured as granted for Google consent mode', () => {
    expect(
      mapGooglefcConsentModeValuesToGtag({
        adStoragePurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.NOT_APPLICABLE,
        analyticsStoragePurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.NOT_CONFIGURED,
        adUserDataPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        adPersonalizationPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
      })
    ).toEqual({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });

  it('allows ad loading only when ad-related signals are granted', () => {
    expect(
      canServeAdsFromGooglefcConsentMode({
        adStoragePurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        adUserDataPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        adPersonalizationPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
      })
    ).toBe(true);

    expect(
      canServeAdsFromGooglefcConsentMode({
        adStoragePurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        adUserDataPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.DENIED,
        adPersonalizationPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
      })
    ).toBe(false);
  });

  it('builds a CMP-managed consent snapshot', () => {
    expect(
      buildManagedCmpConsentSnapshot({
        adStoragePurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        analyticsStoragePurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.DENIED,
        adUserDataPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        adPersonalizationPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
      })
    ).toEqual({
      rawValues: {
        adStoragePurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        adUserDataPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        adPersonalizationPurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        analyticsStoragePurposeConsentStatus: GOOGLE_FC_CONSENT_MODE_STATUS.DENIED,
      },
      purposeStatuses: {
        ad_storage: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        ad_user_data: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        ad_personalization: GOOGLE_FC_CONSENT_MODE_STATUS.GRANTED,
        analytics_storage: GOOGLE_FC_CONSENT_MODE_STATUS.DENIED,
      },
      googleConsent: {
        ad_storage: 'granted',
        analytics_storage: 'denied',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      },
      adsAllowed: true,
      analyticsAllowed: false,
    });
  });
});
