export const PUBLIC_LOCALE = 'fr';
export const PUBLIC_LOCALE_PREFIX = '/fr';

export const ROUTE_NAMES = Object.freeze({
  HOME: 'home',
  MATH_HUB: 'math-hub',
  MATH_MULTIPLICATIONS: 'math-multiplications',
  MATH_SYMMETRY: 'math-symmetry',
  LANGUAGES_HUB: 'languages-hub',
  LANGUAGES_ENGLISH: 'languages-english',
  LANGUAGES_FRENCH: 'languages-french',
  LANGUAGES_FRENCH_TABLE: 'languages-french-table',
  LANGUAGES_FRENCH_FLASHCARDS: 'languages-french-flashcards',
  LANGUAGES_FRENCH_QCM: 'languages-french-qcm',
  LANGUAGES_FRENCH_INPUT: 'languages-french-input',
  STUDIO_OPS_LOGIN: 'studio-ops-login',
  STUDIO_OPS_PANEL: 'studio-ops-panel',
  STUDIO_OPS_HELP: 'studio-ops-help',
  LEGAL_NOTICE: 'legal-notice',
  LEGAL_PRIVACY: 'legal-privacy',
  LEGAL_TERMS: 'legal-terms',
  LEGAL_COOKIES: 'legal-cookies',
});

export const ROUTE_PATHS = Object.freeze({
  HOME: `${PUBLIC_LOCALE_PREFIX}`,
  MATH_HUB: `${PUBLIC_LOCALE_PREFIX}/math`,
  MATH_MULTIPLICATIONS: `${PUBLIC_LOCALE_PREFIX}/math/multiplications`,
  MATH_SYMMETRY: `${PUBLIC_LOCALE_PREFIX}/math/symmetry`,
  LANGUAGES_HUB: `${PUBLIC_LOCALE_PREFIX}/languages`,
  LANGUAGES_ENGLISH: `${PUBLIC_LOCALE_PREFIX}/languages/english`,
  LANGUAGES_FRENCH: `${PUBLIC_LOCALE_PREFIX}/languages/french`,
  LANGUAGES_FRENCH_TABLE: `${PUBLIC_LOCALE_PREFIX}/languages/french/table/:verbKey`,
  LANGUAGES_FRENCH_FLASHCARDS: `${PUBLIC_LOCALE_PREFIX}/languages/french/flashcards/:verbKey`,
  LANGUAGES_FRENCH_QCM: `${PUBLIC_LOCALE_PREFIX}/languages/french/qcm/:verbKey`,
  LANGUAGES_FRENCH_INPUT: `${PUBLIC_LOCALE_PREFIX}/languages/french/input/:verbKey`,
  STUDIO_OPS_LOGIN: '/-/studio-ops',
  STUDIO_OPS_PANEL: '/-/studio-ops/panel',
  STUDIO_OPS_HELP: '/-/studio-ops/help',
  LEGAL_NOTICE: `${PUBLIC_LOCALE_PREFIX}/legal/legal-notice`,
  LEGAL_PRIVACY: `${PUBLIC_LOCALE_PREFIX}/legal/privacy-policy`,
  LEGAL_TERMS: `${PUBLIC_LOCALE_PREFIX}/legal/terms-of-use`,
  LEGAL_COOKIES: `${PUBLIC_LOCALE_PREFIX}/legal/cookie-policy`,
});
