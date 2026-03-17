function toObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function toNonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

export function validateInflectionModule(moduleData) {
  const issues = [];
  const root = toObject(moduleData);
  if (!root) {
    return ['Module invalide: racine absente ou non objet.'];
  }

  const languages = getArray(root.languages);
  if (!languages.length) {
    issues.push('Module invalide: aucune langue definie.');
    return issues;
  }

  const languageIds = new Set();

  for (const language of languages) {
    const languageKey = toNonEmptyString(language?.key);
    if (!languageKey) {
      issues.push('Langue invalide: key manquante.');
      continue;
    }
    if (languageIds.has(languageKey)) {
      issues.push(`Langue invalide: key dupliquee (${languageKey}).`);
    }
    languageIds.add(languageKey);

    const rowKeys = new Set(getArray(language.rows).map((row) => toNonEmptyString(row?.key)).filter(Boolean));
    const slotSets = getArray(language.slotSets);
    const slotSetKeys = new Set();
    for (const slotSet of slotSets) {
      const slotSetKey = toNonEmptyString(slotSet?.key);
      if (!slotSetKey) {
        issues.push(`Langue ${languageKey}: slotSet sans key.`);
        continue;
      }
      if (slotSetKeys.has(slotSetKey)) {
        issues.push(`Langue ${languageKey}: slotSet duplique (${slotSetKey}).`);
      }
      slotSetKeys.add(slotSetKey);
      for (const slot of getArray(slotSet.slots)) {
        const slotKey = toNonEmptyString(slot?.key);
        const rowKey = toNonEmptyString(slot?.rowKey);
        if (!slotKey) {
          issues.push(`Langue ${languageKey}: slot vide dans ${slotSetKey}.`);
        }
        if (!rowKeys.has(rowKey)) {
          issues.push(`Langue ${languageKey}: rowKey inconnu (${rowKey}) dans ${slotSetKey}.`);
        }
      }
    }

    const tenseRefs = [];
    for (const mood of getArray(language.moods)) {
      const moodKey = toNonEmptyString(mood?.key);
      if (!moodKey) {
        issues.push(`Langue ${languageKey}: mode sans key.`);
        continue;
      }
      for (const tense of getArray(mood.tenses)) {
        const tenseKey = toNonEmptyString(tense?.key);
        const slotSetKey = toNonEmptyString(tense?.slotSetKey);
        if (!tenseKey) {
          issues.push(`Langue ${languageKey}: temps sans key dans ${moodKey}.`);
          continue;
        }
        if (!slotSetKeys.has(slotSetKey)) {
          issues.push(`Langue ${languageKey}: slotSet inconnu (${slotSetKey}) pour ${moodKey}.${tenseKey}.`);
        }
        tenseRefs.push({ key: `${moodKey}.${tenseKey}`, slotSetKey });
      }
    }

    const verbs = getArray(language.verbs);
    for (const verb of verbs) {
      const verbKey = toNonEmptyString(verb?.key);
      if (!verbKey) {
        issues.push(`Langue ${languageKey}: verbe sans key.`);
        continue;
      }
      const forms = toObject(verb.forms) || {};
      for (const tenseRef of tenseRefs) {
        const formSet = toObject(forms[tenseRef.key]);
        if (!formSet) {
          issues.push(`Langue ${languageKey}: ${verbKey} manque ${tenseRef.key}.`);
          continue;
        }
        const slotSet = slotSets.find((item) => item.key === tenseRef.slotSetKey);
        for (const slot of getArray(slotSet?.slots)) {
          const slotKey = toNonEmptyString(slot?.key);
          if (!toNonEmptyString(formSet[slotKey])) {
            issues.push(`Langue ${languageKey}: ${verbKey} manque le slot ${slotKey} pour ${tenseRef.key}.`);
          }
        }
      }
    }
  }

  return issues;
}

export function getInflectionLanguage(moduleData, languageKey) {
  return getArray(moduleData?.languages).find((language) => language?.key === languageKey) || null;
}

export function getInflectionVerb(moduleData, languageKey, verbKey) {
  return getArray(getInflectionLanguage(moduleData, languageKey)?.verbs).find((verb) => verb?.key === verbKey) || null;
}

export function getInflectionMood(moduleData, languageKey, moodKey) {
  return getArray(getInflectionLanguage(moduleData, languageKey)?.moods).find((mood) => mood?.key === moodKey) || null;
}

export function getInflectionTense(moduleData, languageKey, moodKey, tenseKey) {
  return getArray(getInflectionMood(moduleData, languageKey, moodKey)?.tenses).find((tense) => tense?.key === tenseKey) || null;
}

export function buildInflectionRows(moduleData, languageKey, verbKey, moodKey, tenseKey) {
  const language = getInflectionLanguage(moduleData, languageKey);
  const verb = getInflectionVerb(moduleData, languageKey, verbKey);
  const tense = getInflectionTense(moduleData, languageKey, moodKey, tenseKey);
  if (!language || !verb || !tense) {
    return [];
  }

  const slotSet = getArray(language.slotSets).find((item) => item?.key === tense.slotSetKey);
  const formSet = toObject(verb.forms?.[`${moodKey}.${tenseKey}`]);
  if (!slotSet || !formSet) {
    return [];
  }

  return getArray(language.rows)
    .map((row) => {
      const slots = getArray(slotSet.slots).filter((slot) => slot?.rowKey === row?.key);
      if (!slots.length) {
        return null;
      }
      const forms = slots.map((slot) => toNonEmptyString(formSet[slot.key])).filter(Boolean);
      const slotLabels = slots.map((slot) => toNonEmptyString(slot.label)).filter(Boolean);
      return {
        key: row.key,
        label: row.label,
        slotLabels,
        forms: [...new Set(forms)],
      };
    })
    .filter(Boolean);
}
