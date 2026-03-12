// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyConsentToScripts, clearConsentScripts } from '@/features/consent/scriptManager';
import { getAdsRuntimeState, initAdsRuntime, resetAdsRuntimeForTests, syncAdsConsent } from './adsRuntime';

describe('adsRuntime', () => {
  beforeEach(() => {
    clearConsentScripts();
    resetAdsRuntimeForTests();
    delete window.gtag;
  });

  afterEach(() => {
    clearConsentScripts();
    resetAdsRuntimeForTests();
    delete window.gtag;
  });

  it('stays disabled when no ad provider is configured', () => {
    const state = initAdsRuntime();

    expect(state).toMatchObject({
      provider: 'none',
      enabled: false,
      scriptRegistered: false,
    });
    expect(document.querySelector('script[data-consent-category="ads"]')).toBeNull();
  });

  it('registers a consent-gated bootstrap script when AdSense is configured', () => {
    initAdsRuntime({
      provider: 'adsense',
      adsenseClient: 'ca-pub-1234567890',
    });

    expect(document.querySelector('script[data-consent-category="ads"]')).toBeNull();

    applyConsentToScripts({ ads: true });

    const script = document.querySelector('script[data-consent-category="ads"]');
    expect(script).not.toBeNull();
    expect(script?.src).toContain('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
    expect(script?.src).toContain('client=ca-pub-1234567890');
  });

  it('waits for CMP-managed consent mode before injecting AdSense', () => {
    const googlefc = {
      callbackQueue: [],
      getGoogleConsentModeValues: () => ({
        ad_storage: 'CONSENT_MODE_GRANTED',
        analytics_storage: 'CONSENT_MODE_DENIED',
        ad_user_data: 'CONSENT_MODE_GRANTED',
        ad_personalization: 'CONSENT_MODE_GRANTED',
      }),
    };
    window.googlefc = googlefc;

    initAdsRuntime({
      provider: 'adsense',
      adsenseClient: 'ca-pub-1234567890',
      managedConsent: true,
    });

    expect(document.querySelector('script[data-consent-category="ads"]')).toBeNull();
    expect(googlefc.callbackQueue).toHaveLength(1);

    googlefc.callbackQueue[0].CONSENT_MODE_DATA_READY();

    const script = document.querySelector('script[data-consent-category="ads"]');
    expect(script?.src).toContain('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
    expect(getAdsRuntimeState()).toMatchObject({
      source: 'cmp',
      adsAllowed: true,
      analyticsAllowed: false,
    });
  });

  it('syncs Google Consent Mode compatible state and updates gtag when available', () => {
    const gtag = vi.fn();

    const snapshot = syncAdsConsent(
      {
        necessary: true,
        analytics: true,
        ads: false,
      },
      gtag
    );

    expect(snapshot.adsAllowed).toBe(false);
    expect(snapshot.analyticsAllowed).toBe(true);
    expect(snapshot.googleConsent).toEqual({
      ad_storage: 'denied',
      analytics_storage: 'granted',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    expect(gtag).toHaveBeenCalledWith('consent', 'update', snapshot.googleConsent);
    expect(getAdsRuntimeState()).toMatchObject({
      adsAllowed: false,
      analyticsAllowed: true,
      consent: snapshot.googleConsent,
    });
  });
});
