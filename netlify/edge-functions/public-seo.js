import { buildPublicSeoModel, escapeHtmlAttribute } from '../../src/features/seo/publicSeo.js';

function replaceTag(html, slot, replacement) {
  const pattern = new RegExp(`<[^>]+data-seo-slot=["']${slot}["'][^>]*>`, 'i');
  return html.replace(pattern, replacement);
}

function replaceTitle(html, title) {
  return html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtmlAttribute(title)}</title>`);
}

function applySeoToHtml(html, seo) {
  let updated = replaceTitle(html, seo.title);

  updated = replaceTag(
    updated,
    'description',
    `<meta name="description" content="${escapeHtmlAttribute(seo.description)}" data-seo-slot="description" />`,
  );
  updated = replaceTag(
    updated,
    'robots',
    `<meta name="robots" content="${escapeHtmlAttribute(seo.robots)}" data-seo-slot="robots" />`,
  );
  updated = replaceTag(
    updated,
    'canonical',
    `<link rel="canonical" href="${escapeHtmlAttribute(seo.canonicalUrl)}" data-seo-slot="canonical" />`,
  );
  updated = replaceTag(
    updated,
    'og-url',
    `<meta property="og:url" content="${escapeHtmlAttribute(seo.ogUrl)}" data-seo-slot="og-url" />`,
  );
  updated = replaceTag(
    updated,
    'og-title',
    `<meta property="og:title" content="${escapeHtmlAttribute(seo.title)}" data-seo-slot="og-title" />`,
  );
  updated = replaceTag(
    updated,
    'og-description',
    `<meta property="og:description" content="${escapeHtmlAttribute(seo.description)}" data-seo-slot="og-description" />`,
  );
  updated = replaceTag(
    updated,
    'og-image',
    `<meta property="og:image" content="${escapeHtmlAttribute(seo.ogImageUrl)}" data-seo-slot="og-image" />`,
  );
  updated = replaceTag(
    updated,
    'twitter-card',
    `<meta name="twitter:card" content="${escapeHtmlAttribute(seo.twitterCard)}" data-seo-slot="twitter-card" />`,
  );
  updated = replaceTag(
    updated,
    'twitter-title',
    `<meta name="twitter:title" content="${escapeHtmlAttribute(seo.twitterTitle)}" data-seo-slot="twitter-title" />`,
  );
  updated = replaceTag(
    updated,
    'twitter-description',
    `<meta name="twitter:description" content="${escapeHtmlAttribute(seo.twitterDescription)}" data-seo-slot="twitter-description" />`,
  );
  updated = replaceTag(
    updated,
    'twitter-image',
    `<meta name="twitter:image" content="${escapeHtmlAttribute(seo.twitterImageUrl)}" data-seo-slot="twitter-image" />`,
  );

  return updated;
}

export default async (request, context) => {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('text/html')) {
    return response;
  }

  const url = new URL(request.url);
  const seo = buildPublicSeoModel({ pathname: url.pathname, hostname: url.hostname });
  const html = await response.text();
  const body = applySeoToHtml(html, seo);
  const headers = new Headers(response.headers);

  headers.set('X-Robots-Tag', seo.robots);

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
