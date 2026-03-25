import JSZip from 'jszip';
import { SYMMETRY_VALIDATOR_VERSION } from '@/features/math/symmetryShapeReview';

const REVIEW_STATUS_EXPORTABLE = new Set(['accepted', 'review', 'rejected']);

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function toUtcIsoDate(date) {
  return `${date.getUTCFullYear()}-${padNumber(date.getUTCMonth() + 1)}-${padNumber(date.getUTCDate())}`;
}

export function buildNextSymmetryUpdatedAt(currentUpdatedAt, now = new Date()) {
  const today = toUtcIsoDate(now);
  const match = String(currentUpdatedAt || '').match(/^(\d{4}-\d{2}-\d{2})\.(\d+)$/);

  if (!match || match[1] !== today) {
    return `${today}.1`;
  }

  return `${today}.${Number.parseInt(match[2], 10) + 1}`;
}

function sanitizeExportShape(shape) {
  const payload = {
    id: shape.id,
    points: shape.points.map((point) => ({
      x: point.x,
      y: point.y,
    })),
  };

  if (REVIEW_STATUS_EXPORTABLE.has(shape.reviewStatus)) {
    payload.reviewStatus = shape.reviewStatus;
  }

  return payload;
}

export function buildSymmetryExportPayload({
  entries,
  gridSize,
  axes,
  currentUpdatedAt,
  currentValidatedAt,
  currentValidatorVersion,
  now = new Date(),
}) {
  const keptEntries = (Array.isArray(entries) ? entries : [])
    .filter((entry) => !entry.deleted)
    .map((entry) => sanitizeExportShape(entry))
    .sort((left, right) => left.id.localeCompare(right.id, 'fr'));

  const grouped = new Map([
    [3, []],
    [4, []],
    [5, []],
  ]);

  for (const entry of keptEntries) {
    const pointCount = entry.points.length;
    if (grouped.has(pointCount)) {
      grouped.get(pointCount).push(entry);
    }
  }

  const nextUpdatedAt = buildNextSymmetryUpdatedAt(currentUpdatedAt, now);
  const validatedAt = now.toISOString();
  const validatorVersion = currentValidatorVersion || SYMMETRY_VALIDATOR_VERSION;
  const manifest = {
    updatedAt: nextUpdatedAt,
    validatedAt,
    validatorVersion,
    gridSize,
    axes,
    groups: [
      { key: 'threePoints', file: 'shapes-3-points.json', points: 3, updatedAt: nextUpdatedAt },
      { key: 'fourPoints', file: 'shapes-4-points.json', points: 4, updatedAt: nextUpdatedAt },
      { key: 'fivePoints', file: 'shapes-5-points.json', points: 5, updatedAt: nextUpdatedAt },
    ],
  };

  const files = [
    { file: 'shapes-3-points.json', shapes: grouped.get(3) },
    { file: 'shapes-4-points.json', shapes: grouped.get(4) },
    { file: 'shapes-5-points.json', shapes: grouped.get(5) },
  ];

  return {
    manifest,
    files,
    nextUpdatedAt,
    currentValidatedAt: currentValidatedAt || '',
    validatedAt,
  };
}

export async function buildSymmetryExportZipBlob(payload) {
  const zip = new JSZip();
  const root = zip.folder('math')?.folder('symmetry');
  if (!root) {
    throw new Error('zip-root-unavailable');
  }

  root.file('manifest.json', `${JSON.stringify(payload.manifest, null, 2)}\n`);
  for (const file of payload.files) {
    root.file(file.file, `${JSON.stringify(file.shapes, null, 2)}\n`);
  }

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });
}
