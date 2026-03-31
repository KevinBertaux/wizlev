import { PUBLIC_LOCALE_PREFIX, ROUTE_PATHS } from '../../router/routes.js';

export const SEO_CANONICAL_HOST = 'wizlev.com';
export const SEO_CANONICAL_ORIGIN = `https://${SEO_CANONICAL_HOST}`;
export const SEO_OG_IMAGE_PATH = '/og-wizlev.png';
export const SEO_OG_IMAGE_URL = `${SEO_CANONICAL_ORIGIN}${SEO_OG_IMAGE_PATH}`;
export const SEO_SITE_NAME = 'WizLev';
export const SEO_DEFAULT_TITLE = 'WizLev | Maths, anglais et français pour enfants';
export const SEO_DEFAULT_DESCRIPTION =
  "Application educative pour reviser les maths, l'anglais et le francais avec des activites adaptees aux enfants.";

const LEGACY_HOSTS = new Set(['manabuplay.fr', 'www.manabuplay.fr']);
const NON_INDEXABLE_PREFIXES = ['/-/'];
const KNOWN_CANONICAL_PATHS = new Set(Object.values(ROUTE_PATHS).filter((path) => path.startsWith(PUBLIC_LOCALE_PREFIX)));

const ROUTE_RULES = [
  {
    match: (path) => path === ROUTE_PATHS.HOME,
    title: SEO_DEFAULT_TITLE,
    description:
      'Plateforme de revision pour enfants avec modules de maths, anglais et francais, pensee pour une progression simple et rassurante.',
  },
  {
    match: (path) => path === ROUTE_PATHS.MATH_HUB,
    title: 'Maths | WizLev',
    description: 'Reviser les maths avec les modules de tables de multiplication et de symetrie.',
  },
  {
    match: (path) => path === ROUTE_PATHS.MATH_MULTIPLICATIONS,
    title: 'Maths - Tables de multiplication | WizLev',
    description: "S'entrainer aux tables de multiplication avec score, serie et questions progressives.",
  },
  {
    match: (path) => path === ROUTE_PATHS.MATH_SYMMETRY,
    title: 'Maths - Symetrie | WizLev',
    description: 'Travailler la symetrie avec des figures sur quadrillage et une banque editoriale controlee.',
  },
  {
    match: (path) => path === ROUTE_PATHS.LANGUAGES_HUB,
    title: 'Langues | WizLev',
    description: "Reviser les langues avec les modules d'anglais et de francais.",
  },
  {
    match: (path) => path === ROUTE_PATHS.LANGUAGES_ENGLISH,
    title: 'Anglais | WizLev',
    description: "Reviser le vocabulaire anglais avec des listes de mots, des flashcards et l'audio.",
  },
  {
    match: (path) => path === ROUTE_PATHS.LANGUAGES_FRENCH,
    title: 'Francais | WizLev',
    description: 'Reviser la conjugaison francaise avec tableaux, flashcards, QCM et saisie libre.',
  },
  {
    match: (path) => path === ROUTE_PATHS.LEGAL_NOTICE,
    title: 'Mentions legales | WizLev',
    description: 'Consulter les mentions legales de WizLev.',
  },
  {
    match: (path) => path === ROUTE_PATHS.LEGAL_PRIVACY,
    title: 'Confidentialite | WizLev',
    description: 'Consulter la politique de confidentialite de WizLev.',
  },
  {
    match: (path) => path === ROUTE_PATHS.LEGAL_TERMS,
    title: "Conditions d'utilisation | WizLev",
    description: "Consulter les conditions d'utilisation de WizLev.",
  },
  {
    match: (path) => path === ROUTE_PATHS.LEGAL_COOKIES,
    title: 'Cookies | WizLev',
    description: 'Consulter la politique de cookies de WizLev.',
  },
];

function normalizeLegacyPublicPath(pathname) {
  switch (pathname) {
    case '/':
      return ROUTE_PATHS.HOME;
    case '/math':
      return ROUTE_PATHS.MATH_HUB;
    case '/math/multiplications':
      return ROUTE_PATHS.MATH_MULTIPLICATIONS;
    case '/math/symmetry':
      return ROUTE_PATHS.MATH_SYMMETRY;
    case '/languages':
      return ROUTE_PATHS.LANGUAGES_HUB;
    case '/languages/english':
      return ROUTE_PATHS.LANGUAGES_ENGLISH;
    case '/languages/french':
      return ROUTE_PATHS.LANGUAGES_FRENCH;
    case '/legal/legal-notice':
      return ROUTE_PATHS.LEGAL_NOTICE;
    case '/legal/privacy-policy':
      return ROUTE_PATHS.LEGAL_PRIVACY;
    case '/legal/terms-of-use':
      return ROUTE_PATHS.LEGAL_TERMS;
    case '/legal/cookie-policy':
      return ROUTE_PATHS.LEGAL_COOKIES;
    default:
      return pathname;
  }
}

export function normalizePublicSeoPath(inputPath = '/') {
  const pathname = String(inputPath || '/')
    .split('#')[0]
    .split('?')[0]
    .trim();

  if (!pathname || pathname === '/') {
    return ROUTE_PATHS.HOME;
  }

  if (pathname.startsWith('/languages/french/')) {
    return ROUTE_PATHS.LANGUAGES_FRENCH;
  }

  const legacyNormalized = normalizeLegacyPublicPath(pathname);
  if (legacyNormalized !== pathname) {
    return legacyNormalized;
  }

  if (pathname.startsWith(`${PUBLIC_LOCALE_PREFIX}/languages/french/`)) {
    return ROUTE_PATHS.LANGUAGES_FRENCH;
  }

  if (pathname.startsWith(PUBLIC_LOCALE_PREFIX)) {
    return KNOWN_CANONICAL_PATHS.has(pathname) ? pathname : ROUTE_PATHS.HOME;
  }

  if (pathname.startsWith('/-/')) {
    return pathname;
  }

  return ROUTE_PATHS.HOME;
}

function getRouteSeoForPath(pathname) {
  const normalizedPath = normalizePublicSeoPath(pathname);
  const rule = ROUTE_RULES.find((candidate) => candidate.match(normalizedPath));

  if (rule) {
    return { title: rule.title, description: rule.description };
  }

  if (normalizedPath.startsWith('/-/')) {
    return {
      title: 'Studio Ops | WizLev',
      description: 'Interface interne de gestion et de controle de WizLev.',
    };
  }

  return {
    title: SEO_DEFAULT_TITLE,
    description: SEO_DEFAULT_DESCRIPTION,
  };
}

function shouldNoIndex(hostname, pathname) {
  if (LEGACY_HOSTS.has(hostname)) {
    return true;
  }

  return NON_INDEXABLE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function buildPublicSeoModel({ pathname = '/', hostname = SEO_CANONICAL_HOST } = {}) {
  const normalizedPath = normalizePublicSeoPath(pathname);
  const canonicalUrl = `${SEO_CANONICAL_ORIGIN}${normalizedPath}`;
  const { title, description } = getRouteSeoForPath(normalizedPath);
  const noindex = shouldNoIndex(hostname, normalizedPath);

  return {
    title,
    description,
    canonicalUrl,
    ogUrl: canonicalUrl,
    ogImageUrl: SEO_OG_IMAGE_URL,
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
    ogType: 'website',
    ogSiteName: SEO_SITE_NAME,
    ogLocale: 'fr_FR',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImageUrl: SEO_OG_IMAGE_URL,
  };
}

function setMetaContent(selector, content) {
  if (typeof document === 'undefined') {
    return;
  }

  const node = document.head.querySelector(selector);
  if (!node) {
    return;
  }

  node.setAttribute('content', content);
}

function setLinkHref(selector, href) {
  if (typeof document === 'undefined') {
    return;
  }

  const node = document.head.querySelector(selector);
  if (!node) {
    return;
  }

  node.setAttribute('href', href);
}

export function applyPublicSeoToDocument({
  pathname = '/',
  hostname,
} = {}) {
  if (typeof document === 'undefined') {
    return null;
  }

  const resolvedHostname =
    hostname || (typeof window !== 'undefined' && window.location ? window.location.hostname : SEO_CANONICAL_HOST);

  const model = buildPublicSeoModel({ pathname, hostname: resolvedHostname });
  document.title = model.title;

  setMetaContent('meta[data-seo-slot="description"]', model.description);
  setMetaContent('meta[data-seo-slot="robots"]', model.robots);
  setLinkHref('link[data-seo-slot="canonical"]', model.canonicalUrl);
  setMetaContent('meta[data-seo-slot="og-url"]', model.ogUrl);
  setMetaContent('meta[data-seo-slot="og-title"]', model.title);
  setMetaContent('meta[data-seo-slot="og-description"]', model.description);
  setMetaContent('meta[data-seo-slot="og-image"]', model.ogImageUrl);
  setMetaContent('meta[data-seo-slot="twitter-card"]', model.twitterCard);
  setMetaContent('meta[data-seo-slot="twitter-title"]', model.twitterTitle);
  setMetaContent('meta[data-seo-slot="twitter-description"]', model.twitterDescription);
  setMetaContent('meta[data-seo-slot="twitter-image"]', model.twitterImageUrl);

  return model;
}

export function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}




