function normalizeVersionToken(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function normalizeManifestEntry(entry, fallbackVersion = '') {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const key = typeof entry.key === 'string' && entry.key.trim() ? entry.key.trim() : '';
  const file = typeof entry.file === 'string' && entry.file.trim() ? entry.file.trim() : '';

  if (!key || !file) {
    return null;
  }

  const explicitToken =
    normalizeVersionToken(entry.version) ||
    normalizeVersionToken(entry.updatedAt) ||
    normalizeVersionToken(entry.checksum) ||
    normalizeVersionToken(entry.hash) ||
    normalizeVersionToken(entry.etag);

  return {
    ...entry,
    key,
    file,
    token: explicitToken || normalizeVersionToken(fallbackVersion),
    hasExplicitToken: Boolean(explicitToken),
  };
}

export function getManifestVersionToken(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  return normalizeVersionToken(payload.version) || normalizeVersionToken(payload.updatedAt);
}

export function compareManifestVersionTokens(left, right) {
  return String(left || '').localeCompare(String(right || ''));
}

export function getLatestManifestVersionToken(...versions) {
  return versions.reduce((latest, current) => {
    if (!current) {
      return latest;
    }
    return compareManifestVersionTokens(current, latest) > 0 ? current : latest;
  }, '');
}

export function extractManifestEntries(payload) {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (Array.isArray(payload.lists)) {
    return payload.lists;
  }

  if (Array.isArray(payload.groups)) {
    return payload.groups;
  }

  if (Array.isArray(payload.verbs)) {
    return payload.verbs;
  }

  return [];
}

export function normalizeManifestEntries(payload, fallbackVersion = '') {
  return extractManifestEntries(payload)
    .map((entry) => normalizeManifestEntry(entry, fallbackVersion))
    .filter(Boolean);
}

export function indexManifestEntriesByKey(payload, fallbackVersion = '') {
  return Object.fromEntries(
    normalizeManifestEntries(payload, fallbackVersion).map((entry) => [entry.key, entry])
  );
}

export function hasManifestEntryChanged(remoteEntry, baselineEntry) {
  const remoteToken =
    remoteEntry && typeof remoteEntry === 'object' ? normalizeVersionToken(remoteEntry.token) : '';
  const baselineToken =
    baselineEntry && typeof baselineEntry === 'object'
      ? normalizeVersionToken(baselineEntry.token)
      : normalizeVersionToken(baselineEntry);

  if (!remoteToken) {
    return false;
  }

  return remoteToken !== baselineToken;
}

export function readRemotePayloadCache(storageKey) {
  if (!storageKey || typeof window === 'undefined') {
    return {
      version: '',
      entries: {},
      payloads: {},
      cachedAt: '',
    };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {
        version: '',
        entries: {},
        payloads: {},
        cachedAt: '',
      };
    }

    const parsed = JSON.parse(raw);
    const entries =
      parsed && typeof parsed === 'object' && parsed.entries && typeof parsed.entries === 'object'
        ? parsed.entries
        : {};
    const payloads =
      parsed && typeof parsed === 'object' && parsed.payloads && typeof parsed.payloads === 'object'
        ? parsed.payloads
        : {};

    return {
      version: getManifestVersionToken(parsed),
      entries,
      payloads,
      cachedAt: normalizeVersionToken(parsed?.cachedAt),
    };
  } catch {
    return {
      version: '',
      entries: {},
      payloads: {},
      cachedAt: '',
    };
  }
}

export function writeRemotePayloadCache(storageKey, payload) {
  if (!storageKey || typeof window === 'undefined') {
    return false;
  }

  const version = getManifestVersionToken(payload);
  if (!version) {
    return false;
  }

  const payloads =
    payload && typeof payload === 'object' && payload.payloads && typeof payload.payloads === 'object'
      ? payload.payloads
      : {};
  const entries =
    payload && typeof payload === 'object' && payload.entries && typeof payload.entries === 'object'
      ? payload.entries
      : {};

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version,
        entries,
        payloads,
        cachedAt: new Date().toISOString(),
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function clearRemotePayloadCache(storageKey) {
  if (!storageKey || typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(storageKey);
}
