function normalizeVersionToken(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
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

export function readRemotePayloadCache(storageKey) {
  if (!storageKey || typeof window === 'undefined') {
    return {
      version: '',
      payloads: {},
      cachedAt: '',
    };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {
        version: '',
        payloads: {},
        cachedAt: '',
      };
    }

    const parsed = JSON.parse(raw);
    const payloads =
      parsed && typeof parsed === 'object' && parsed.payloads && typeof parsed.payloads === 'object'
        ? parsed.payloads
        : {};

    return {
      version: getManifestVersionToken(parsed),
      payloads,
      cachedAt: normalizeVersionToken(parsed?.cachedAt),
    };
  } catch {
    return {
      version: '',
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

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version,
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
