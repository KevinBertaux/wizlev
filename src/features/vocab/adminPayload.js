export function normalizeWords(words) {
  if (!Array.isArray(words)) {
    return [];
  }

  return words.map((word) => ({
    english: (word?.english || '').trim(),
    french: (word?.french || '').trim(),
  }));
}

export function buildVocabPayload(draft) {
  const name = (draft?.name || '').trim();
  const description = (draft?.description || '').trim();
  const normalizedWords = normalizeWords(draft?.words || []);

  if (!name) {
    return { ok: false, error: 'Le nom de la liste est obligatoire.' };
  }

  const hasPartialWord = normalizedWords.some(
    (word) => (word.english && !word.french) || (!word.english && word.french)
  );
  if (hasPartialWord) {
    return {
      ok: false,
      error: 'Chaque ligne doit contenir un mot anglais et sa traduction française.',
    };
  }

  const completeWords = normalizedWords.filter((word) => word.english && word.french);
  if (completeWords.length === 0) {
    return { ok: false, error: 'Ajoute au moins un mot complet avant de sauvegarder.' };
  }

  return {
    ok: true,
    payload: {
      name,
      description,
      words: completeWords,
    },
  };
}
