import identiteEcole from '@/content/vocab/en/identite-ecole.json';
import salutationsPolitesse from '@/content/vocab/en/salutations-politesse.json';
import tempsSemaine from '@/content/vocab/en/temps-semaine.json';
import consignesClasse from '@/content/vocab/en/consignes-classe.json';
import reglesClasse from '@/content/vocab/en/regles-classe.json';
import materielScolaire from '@/content/vocab/en/materiel-scolaire.json';
import activitesCapacites from '@/content/vocab/en/activites-capacites.json';
import fetesSymboles from '@/content/vocab/en/fetes-symboles.json';
import paysNationalites from '@/content/vocab/en/pays-nationalites.json';
import prepositionsLieu from '@/content/vocab/en/prepositions-lieu.json';
import villePersonnes from '@/content/vocab/en/ville-personnes.json';
import maisonVetements from '@/content/vocab/en/maison-vetements.json';
import animauxObjets from '@/content/vocab/en/animaux-objets.json';
import alimentsBoissons from '@/content/vocab/en/aliments-boissons.json';
import fruits from '@/content/vocab/en/fruits.json';
import legumes from '@/content/vocab/en/legumes.json';
import fruits2 from '@/content/vocab/en/fruits-2.json';
import legumes2 from '@/content/vocab/en/legumes-2.json';

const STORAGE_PREFIX = 'manabuplay_vocab_list_';

const baseVocabLists = {
  identiteEcole: {
    key: 'identiteEcole',
    label: identiteEcole.label || identiteEcole.name,
    name: identiteEcole.name,
    description: identiteEcole.description,
    words: identiteEcole.words,
  },
  salutationsPolitesse: {
    key: 'salutationsPolitesse',
    label: salutationsPolitesse.label || salutationsPolitesse.name,
    name: salutationsPolitesse.name,
    description: salutationsPolitesse.description,
    words: salutationsPolitesse.words,
  },
  tempsSemaine: {
    key: 'tempsSemaine',
    label: tempsSemaine.label || tempsSemaine.name,
    name: tempsSemaine.name,
    description: tempsSemaine.description,
    words: tempsSemaine.words,
  },
  consignesClasse: {
    key: 'consignesClasse',
    label: consignesClasse.label || consignesClasse.name,
    name: consignesClasse.name,
    description: consignesClasse.description,
    words: consignesClasse.words,
  },
  reglesClasse: {
    key: 'reglesClasse',
    label: reglesClasse.label || reglesClasse.name,
    name: reglesClasse.name,
    description: reglesClasse.description,
    words: reglesClasse.words,
  },
  materielScolaire: {
    key: 'materielScolaire',
    label: materielScolaire.label || materielScolaire.name,
    name: materielScolaire.name,
    description: materielScolaire.description,
    words: materielScolaire.words,
  },
  activitesCapacites: {
    key: 'activitesCapacites',
    label: activitesCapacites.label || activitesCapacites.name,
    name: activitesCapacites.name,
    description: activitesCapacites.description,
    words: activitesCapacites.words,
  },
  fetesSymboles: {
    key: 'fetesSymboles',
    label: fetesSymboles.label || fetesSymboles.name,
    name: fetesSymboles.name,
    description: fetesSymboles.description,
    words: fetesSymboles.words,
  },
  paysNationalites: {
    key: 'paysNationalites',
    label: paysNationalites.label || paysNationalites.name,
    name: paysNationalites.name,
    description: paysNationalites.description,
    words: paysNationalites.words,
  },
  prepositionsLieu: {
    key: 'prepositionsLieu',
    label: prepositionsLieu.label || prepositionsLieu.name,
    name: prepositionsLieu.name,
    description: prepositionsLieu.description,
    words: prepositionsLieu.words,
  },
  villePersonnes: {
    key: 'villePersonnes',
    label: villePersonnes.label || villePersonnes.name,
    name: villePersonnes.name,
    description: villePersonnes.description,
    words: villePersonnes.words,
  },
  maisonVetements: {
    key: 'maisonVetements',
    label: maisonVetements.label || maisonVetements.name,
    name: maisonVetements.name,
    description: maisonVetements.description,
    words: maisonVetements.words,
  },
  animauxObjets: {
    key: 'animauxObjets',
    label: animauxObjets.label || animauxObjets.name,
    name: animauxObjets.name,
    description: animauxObjets.description,
    words: animauxObjets.words,
  },
  alimentsBoissons: {
    key: 'alimentsBoissons',
    label: alimentsBoissons.label || alimentsBoissons.name,
    name: alimentsBoissons.name,
    description: alimentsBoissons.description,
    words: alimentsBoissons.words,
  },
  fruits: {
    key: 'fruits',
    label: fruits.label || fruits.name,
    name: fruits.name,
    description: fruits.description,
    words: fruits.words,
  },
  legumes: {
    key: 'legumes',
    label: legumes.label || legumes.name,
    name: legumes.name,
    description: legumes.description,
    words: legumes.words,
  },
  fruits2: {
    key: 'fruits2',
    label: fruits2.label || fruits2.name,
    name: fruits2.name,
    description: fruits2.description,
    words: fruits2.words,
  },
  legumes2: {
    key: 'legumes2',
    label: legumes2.label || legumes2.name,
    name: legumes2.name,
    description: legumes2.description,
    words: legumes2.words,
  },
};

export const vocabLists = baseVocabLists;

export const vocabListOptions = Object.values(baseVocabLists).map((list) => ({
  key: list.key,
  label: list.label,
  wordCount: Array.isArray(list.words) ? list.words.length : 0,
}));

function cloneWords(words) {
  if (!Array.isArray(words)) {
    return [];
  }
  return words.map((word) => ({
    english: typeof word.english === 'string' ? word.english : '',
    french: typeof word.french === 'string' ? word.french : '',
  }));
}

function sanitizeListPayload(payload, fallbackList) {
  const fallback = fallbackList || { name: '', description: '', words: [] };
  const name =
    payload && typeof payload.name === 'string' && payload.name.trim()
      ? payload.name.trim()
      : fallback.name;
  const description =
    payload && typeof payload.description === 'string'
      ? payload.description.trim()
      : fallback.description;
  const words = cloneWords(payload?.words);

  return {
    name,
    description,
    words,
  };
}

function getStorageKey(listKey) {
  return `${STORAGE_PREFIX}${listKey}`;
}


export function getVocabList(listKey) {
  const baseList = baseVocabLists[listKey];
  if (!baseList) {
    return null;
  }

  if (typeof window === 'undefined') {
    return sanitizeListPayload(baseList, baseList);
  }

  const raw = localStorage.getItem(getStorageKey(listKey));
  if (!raw) {
    return sanitizeListPayload(baseList, baseList);
  }

  try {
    const parsed = JSON.parse(raw);
    return sanitizeListPayload(parsed, baseList);
  } catch {
    return sanitizeListPayload(baseList, baseList);
  }
}

export function saveVocabList(listKey, payload) {
  const baseList = baseVocabLists[listKey];
  if (!baseList || typeof window === 'undefined') {
    return false;
  }

  const sanitized = sanitizeListPayload(payload, baseList);
  try {
    localStorage.setItem(getStorageKey(listKey), JSON.stringify(sanitized));
    return true;
  } catch {
    return false;
  }
}

export function resetVocabList(listKey) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(getStorageKey(listKey));
}



