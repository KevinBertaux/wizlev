import { resolveCmpProviderConfig } from './cmpConfig';

export const CMP_RUNTIME_KEY = '__manabuCmpRuntime';

let initializedProviderId = null;
let consentApiCallbackRegistered = false;
let consentModeCallbackRegistered = false;

function isBrowser() {
  return typeof window !== 'undefined';
}

function writeRuntimeState(nextState) {
  if (!isBrowser()) {
    return nextState;
  }

  const previousState = window[CMP_RUNTIME_KEY] || {};
  const runtimeState = {
    ...previousState,
    ...nextState,
  };
  window[CMP_RUNTIME_KEY] = runtimeState;
  return runtimeState;
}

function ensureGooglefcBootstrap(win) {
  win.googlefc = win.googlefc || {};
  win.googlefc.callbackQueue = Array.isArray(win.googlefc.callbackQueue) ? win.googlefc.callbackQueue : [];
  return win.googlefc;
}

function registerGooglefcCallbacks(win) {
  const googlefc = ensureGooglefcBootstrap(win);

  if (!consentApiCallbackRegistered) {
    googlefc.callbackQueue.push({
      CONSENT_API_READY: () => {
        writeRuntimeState({
          consentApiReady: true,
          revocationSupported: typeof win.googlefc?.showRevocationMessage === 'function',
          updatedAt: new Date().toISOString(),
        });
      },
    });
    consentApiCallbackRegistered = true;
  }

  if (!consentModeCallbackRegistered) {
    googlefc.callbackQueue.push({
      CONSENT_MODE_DATA_READY: () => {
        writeRuntimeState({
          consentModeReady: true,
          consentModeValues:
            typeof win.googlefc?.getGoogleConsentModeValues === 'function'
              ? win.googlefc.getGoogleConsentModeValues()
              : null,
          updatedAt: new Date().toISOString(),
        });
      },
    });
    consentModeCallbackRegistered = true;
  }
}

export function initCmpRuntime(options = {}) {
  const providerConfig = resolveCmpProviderConfig(options);

  if (!isBrowser()) {
    return {
      provider: providerConfig.id,
      enabled: providerConfig.enabled,
      managedConsent: providerConfig.managedConsent,
      revocationSupported: false,
    };
  }

  if (initializedProviderId === providerConfig.id) {
    return writeRuntimeState({
      provider: providerConfig.id,
      enabled: providerConfig.enabled,
      managedConsent: providerConfig.managedConsent,
      revocationSupported: typeof window.googlefc?.showRevocationMessage === 'function',
    });
  }

  if (providerConfig.id === 'google_privacy_messaging') {
    ensureGooglefcBootstrap(window);
    registerGooglefcCallbacks(window);
  }

  initializedProviderId = providerConfig.id;

  return writeRuntimeState({
    provider: providerConfig.id,
    enabled: providerConfig.enabled,
    managedConsent: providerConfig.managedConsent,
    revocationSupported: typeof window.googlefc?.showRevocationMessage === 'function',
  });
}

export function openCmpPrivacyOptions() {
  if (!isBrowser()) {
    return false;
  }

  if (typeof window.googlefc?.showRevocationMessage === 'function') {
    window.googlefc.showRevocationMessage();
    writeRuntimeState({
      revocationSupported: true,
      lastPrivacyManagerOpenAt: new Date().toISOString(),
    });
    return true;
  }

  if (Array.isArray(window.googlefc?.callbackQueue)) {
    window.googlefc.callbackQueue.push({
      CONSENT_API_READY: () => {
        if (typeof window.googlefc?.showRevocationMessage === 'function') {
          window.googlefc.showRevocationMessage();
          writeRuntimeState({
            revocationSupported: true,
            lastPrivacyManagerOpenAt: new Date().toISOString(),
          });
        }
      },
    });
    writeRuntimeState({
      revocationRequested: true,
      updatedAt: new Date().toISOString(),
    });
    return true;
  }

  return false;
}

export function getCmpRuntimeState() {
  if (!isBrowser()) {
    return null;
  }

  return window[CMP_RUNTIME_KEY] || null;
}

export function resetCmpRuntimeForTests() {
  initializedProviderId = null;
  consentApiCallbackRegistered = false;
  consentModeCallbackRegistered = false;
  if (isBrowser()) {
    delete window[CMP_RUNTIME_KEY];
    delete window.googlefc;
  }
}
