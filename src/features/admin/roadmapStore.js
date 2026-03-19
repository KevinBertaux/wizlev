import roadmapIndex from '@/content/roadmap/roadmap-index.json';
import backlog from '@/content/roadmap/backlog.json';
import scope010 from '@/content/roadmap/scope-0.1.0.json';
import scope020 from '@/content/roadmap/scope-0.2.0.json';
import scope030 from '@/content/roadmap/scope-0.3.0.json';
import scope040 from '@/content/roadmap/scope-0.4.0.json';
import scope050 from '@/content/roadmap/scope-0.5.0.json';
import scope060 from '@/content/roadmap/scope-0.6.0.json';
import scopeAdsFoundation from '@/content/roadmap/scope-ads-foundation.json';

export const ROADMAP_PRIORITY_ORDER = Object.freeze(['Crit', 'High', 'Med', 'Low']);
export const ROADMAP_DEPENDENCY_STATUS = Object.freeze(['none', 'ready', 'blocked', 'missing', 'invalid', 'cyclic']);

const sourceMap = Object.freeze({
  backlog,
  'scope-0.1.0': scope010,
  'scope-0.2.0': scope020,
  'scope-0.3.0': scope030,
  'scope-0.4.0': scope040,
  'scope-0.5.0': scope050,
  'scope-0.6.0': scope060,
  'scope-ads-foundation': scopeAdsFoundation,
});

function normalizeDependsOn(item) {
  const raw = Array.isArray(item?.dependsOn) ? item.dependsOn : [];
  return Array.from(
    new Set(
      raw
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function normalizeEntry(entry, fallbackIndex) {
  const source = sourceMap[entry?.sourceKey] || { version: 'n/a', items: [] };
  const sourceItems = Array.isArray(source.items) ? source.items : [];

  const items = sourceItems
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const safePriority = ROADMAP_PRIORITY_ORDER.includes(item.priority) ? item.priority : 'Low';
      return {
        id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `roadmap-item-${fallbackIndex}-${index}`,
        priority: safePriority,
        domain: typeof item.domain === 'string' ? item.domain : 'ui',
        feature: typeof item.feature === 'string' ? item.feature : 'general',
        label: typeof item.label === 'string' ? item.label : '',
        done: Boolean(item.done),
        dependsOn: normalizeDependsOn(item),
        sourceEntryId: typeof entry?.id === 'string' ? entry.id : `scope-${fallbackIndex}`,
        sourceEntryTitle: typeof entry?.title === 'string' ? entry.title : `Scope ${fallbackIndex}`,
        sourceEntryType: entry?.type === 'backlog' ? 'backlog' : 'scope',
      };
    })
    .filter((item) => item.label.length > 0);

  return {
    id: typeof entry?.id === 'string' ? entry.id : `scope-${fallbackIndex}`,
    title: typeof entry?.title === 'string' ? entry.title : `Scope ${fallbackIndex}`,
    type: entry?.type === 'backlog' ? 'backlog' : 'scope',
    version: typeof source.version === 'string' ? source.version : '',
    startDate: typeof entry?.startDate === 'string' ? entry.startDate : '',
    endDate: typeof entry?.endDate === 'string' ? entry.endDate : '',
    items,
  };
}

function buildItemsById(entries) {
  return new Map(entries.flatMap((entry) => entry.items.map((item) => [item.id, item])));
}

function detectCyclicItems(itemsById) {
  const visiting = new Set();
  const visited = new Set();
  const cyclic = new Set();

  function visit(itemId, ancestry = []) {
    if (visiting.has(itemId)) {
      const cycleStart = ancestry.indexOf(itemId);
      const cycleNodes = cycleStart >= 0 ? ancestry.slice(cycleStart) : [itemId];
      cycleNodes.forEach((id) => cyclic.add(id));
      cyclic.add(itemId);
      return;
    }

    if (visited.has(itemId)) {
      return;
    }

    visiting.add(itemId);
    const item = itemsById.get(itemId);
    const dependencies = Array.isArray(item?.dependsOn) ? item.dependsOn : [];

    for (const dependencyId of dependencies) {
      if (itemsById.has(dependencyId)) {
        visit(dependencyId, [...ancestry, itemId]);
      }
    }

    visiting.delete(itemId);
    visited.add(itemId);
  }

  for (const itemId of itemsById.keys()) {
    visit(itemId, []);
  }

  return cyclic;
}

export function resolveRoadmapDependencies(entries) {
  const itemsById = buildItemsById(entries);
  const cyclicItems = detectCyclicItems(itemsById);

  return entries.map((entry) => ({
    ...entry,
    items: entry.items.map((item) => {
      const selfDependency = item.dependsOn.includes(item.id);
      const missingDependencies = item.dependsOn.filter((dependencyId) => !itemsById.has(dependencyId));
      const blockedBy = item.dependsOn.filter((dependencyId) => {
        const dependency = itemsById.get(dependencyId);
        return dependency && !dependency.done;
      });
      let dependencyStatus = 'none';

      if (selfDependency) {
        dependencyStatus = 'invalid';
      } else if (cyclicItems.has(item.id)) {
        dependencyStatus = 'cyclic';
      } else if (missingDependencies.length > 0) {
        dependencyStatus = 'missing';
      } else if (item.dependsOn.length === 0) {
        dependencyStatus = 'none';
      } else if (blockedBy.length > 0) {
        dependencyStatus = 'blocked';
      } else {
        dependencyStatus = 'ready';
      }

      const dependencyRefs = item.dependsOn.map((dependencyId) => {
        const dependency = itemsById.get(dependencyId);
        return {
          id: dependencyId,
          label: dependency?.label || dependencyId,
          location: dependency?.sourceEntryId || 'inconnu',
          locationLabel: dependency?.sourceEntryTitle || 'Référence inconnue',
          missing: !dependency,
        };
      });

      const blockedByRefs = blockedBy.map((dependencyId) => {
        const dependency = itemsById.get(dependencyId);
        return {
          id: dependencyId,
          label: dependency?.label || dependencyId,
          location: dependency?.sourceEntryId || 'inconnu',
          locationLabel: dependency?.sourceEntryTitle || 'Référence inconnue',
          missing: !dependency,
        };
      });

      return {
        ...item,
        dependsOn: [...item.dependsOn],
        blockedBy,
        dependencyStatus,
        missingDependencies,
        dependencyRefs,
        blockedByRefs,
      };
    }),
  }));
}

export function getRoadmapEntries() {
  const entries = Array.isArray(roadmapIndex?.entries) ? roadmapIndex.entries : [];
  return resolveRoadmapDependencies(entries.map((entry, index) => normalizeEntry(entry, index + 1)));
}

export function getRoadmapEntryById(id) {
  return getRoadmapEntries().find((entry) => entry.id === id) || null;
}
