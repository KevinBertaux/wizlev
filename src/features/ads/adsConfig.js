import { ROUTE_NAMES } from '@/router/routes';

export const ADS_RUNTIME_KEY = '__manabuAdsRuntime';

export const ADS_PROVIDER_IDS = Object.freeze({
  NONE: 'none',
  ADSENSE: 'adsense',
});

const STUDY_ADS_ROUTE_NAMES = Object.freeze([ROUTE_NAMES.HOME, ROUTE_NAMES.MATH_HUB, ROUTE_NAMES.LANGUAGES_HUB]);

const STUDY_RAIL_RIGHT_SLOT_ID = String(import.meta.env.VITE_ADSENSE_SLOT_STUDY_RAIL_RIGHT || '').trim();
const STUDY_TOP_SLOT_ID = String(import.meta.env.VITE_ADSENSE_SLOT_STUDY_TOP || '').trim();
const STUDY_BOTTOM_SLOT_ID = String(import.meta.env.VITE_ADSENSE_SLOT_STUDY_BOTTOM || '').trim();

export const ADS_SLOT_DEFINITIONS = Object.freeze([
  {
    id: 'study-rail-right',
    label: "Rail droit d'étude",
    format: 'vertical-rail',
    routeNames: STUDY_ADS_ROUTE_NAMES,
    adsenseSlotId: STUDY_RAIL_RIGHT_SLOT_ID,
    enabled: Boolean(STUDY_RAIL_RIGHT_SLOT_ID),
  },
  {
    id: 'study-top-banner',
    label: "Bandeau haut d'étude",
    format: 'top-banner',
    routeNames: STUDY_ADS_ROUTE_NAMES,
    adsenseSlotId: STUDY_TOP_SLOT_ID,
    enabled: Boolean(STUDY_TOP_SLOT_ID),
  },
  {
    id: 'study-bottom-banner',
    label: "Bandeau bas d'étude",
    format: 'mobile-banner',
    routeNames: STUDY_ADS_ROUTE_NAMES,
    adsenseSlotId: STUDY_BOTTOM_SLOT_ID,
    enabled: Boolean(STUDY_BOTTOM_SLOT_ID),
  },
]);

export function resolveAdsProviderConfig({
  provider = import.meta.env.VITE_ADS_PROVIDER || ADS_PROVIDER_IDS.NONE,
  adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT || '',
} = {}) {
  const normalizedProvider = String(provider || ADS_PROVIDER_IDS.NONE).toLowerCase();
  const normalizedClient = String(adsenseClient || '').trim();

  if (normalizedProvider === ADS_PROVIDER_IDS.ADSENSE && normalizedClient) {
    return {
      id: ADS_PROVIDER_IDS.ADSENSE,
      label: 'Google AdSense',
      enabled: true,
      adsenseClient: normalizedClient,
      consentCategory: 'ads',
      script: {
        id: 'adsense-bootstrap',
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${normalizedClient}`,
        async: true,
        defer: false,
        crossOrigin: 'anonymous',
        parentSelector: 'head',
      },
    };
  }

  return {
    id: ADS_PROVIDER_IDS.NONE,
    label: 'Disabled',
    enabled: false,
    adsenseClient: '',
    consentCategory: 'ads',
    script: null,
  };
}
