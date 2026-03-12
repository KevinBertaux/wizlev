import { describe, expect, it } from 'vitest';
import {
  buildManagedCmpConsentSnapshot,
  canServeAdsFromGooglefcConsentMode,
  mapGooglefcConsentModeValuesToGtag,
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

  it('treats not applicable and not configured as granted for Google consent mode', () => {
    expect(
      mapGooglefcConsentModeValuesToGtag({
        ad_storage: 'CONSENT_MODE_NOT_APPLICABLE',
        analytics_storage: 'CONSENT_MODE_NOT_CONFIGURED',
        ad_user_data: 'CONSENT_MODE_GRANTED',
        ad_personalization: 'CONSENT_MODE_GRANTED',
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
        ad_storage: 'CONSENT_MODE_GRANTED',
        ad_user_data: 'CONSENT_MODE_GRANTED',
        ad_personalization: 'CONSENT_MODE_GRANTED',
      })
    ).toBe(true);

    expect(
      canServeAdsFromGooglefcConsentMode({
        ad_storage: 'CONSENT_MODE_GRANTED',
        ad_user_data: 'CONSENT_MODE_DENIED',
        ad_personalization: 'CONSENT_MODE_GRANTED',
      })
    ).toBe(false);
  });

  it('builds a CMP-managed consent snapshot', () => {
    expect(
      buildManagedCmpConsentSnapshot({
        ad_storage: 'CONSENT_MODE_GRANTED',
        analytics_storage: 'CONSENT_MODE_DENIED',
        ad_user_data: 'CONSENT_MODE_GRANTED',
        ad_personalization: 'CONSENT_MODE_GRANTED',
      })
    ).toEqual({
      rawValues: {
        ad_storage: 'CONSENT_MODE_GRANTED',
        analytics_storage: 'CONSENT_MODE_DENIED',
        ad_user_data: 'CONSENT_MODE_GRANTED',
        ad_personalization: 'CONSENT_MODE_GRANTED',
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
