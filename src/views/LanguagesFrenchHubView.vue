<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QuizSelectField from '@/components/QuizSelectField.vue';
import {
  buildFrenchVerbRows,
  getFrenchTense,
  getFrenchVerb,
  isFrenchTenseAvailable,
  listFrenchTenseFamilies,
  listFrenchVerbOptions,
} from '@/features/languages/frenchConjugations';

const DEFAULT_MOOD_KEY = 'indicatif';
const DEFAULT_MODE_KEY = 'table';

const route = useRoute();
const router = useRouter();
const verbOptions = listFrenchVerbOptions();
const tenseFamilies = listFrenchTenseFamilies();

const validVerbKeys = new Set(verbOptions.map((option) => option.value));
const validTenseKeys = new Set(
  tenseFamilies.flatMap((family) => family.options.map((option) => option.key))
);

function resolveVerbKey(value) {
  return typeof value === 'string' && validVerbKeys.has(value)
    ? value
    : (verbOptions[0]?.value ?? '');
}

function resolveTenseKey(value) {
  return typeof value === 'string' && validTenseKeys.has(value) ? value : 'present';
}

function buildFrenchWorkspaceQuery(verbKey, tenseKey, moodKey = DEFAULT_MOOD_KEY, modeKey = DEFAULT_MODE_KEY) {
  return {
    verb: resolveVerbKey(verbKey),
    tense: resolveTenseKey(tenseKey),
    mood: moodKey || DEFAULT_MOOD_KEY,
    mode: modeKey || DEFAULT_MODE_KEY,
  };
}

const selectedVerb = ref(resolveVerbKey(route.query.verb));
const selectedTense = ref(resolveTenseKey(route.query.tense));
const selectedMood = ref(
  typeof route.query.mood === 'string' && route.query.mood ? route.query.mood : DEFAULT_MOOD_KEY
);

const activeVerb = computed(() => getFrenchVerb(selectedVerb.value));
const activeTense = computed(() => getFrenchTense(selectedTense.value, undefined, selectedMood.value));
const rows = computed(() =>
  buildFrenchVerbRows(selectedVerb.value, selectedTense.value, undefined, selectedMood.value)
);
const tenseAvailable = computed(() =>
  isFrenchTenseAvailable(selectedTense.value, undefined, selectedMood.value)
);
const activeFamilyKey = computed(() => activeTense.value?.familyKey || 'present');

const activePillLabel = computed(() => {
  if (!activeVerb.value || !activeTense.value) {
    return '';
  }
  return `${activeVerb.value.label} · ${activeTense.value.label}`;
});

const timeHelperText = computed(() => {
  if (!activeTense.value) {
    return '';
  }
  if (tenseAvailable.value) {
    return `Le temps ${activeTense.value.label.toLowerCase()} est disponible pour la fiche et les trois modes d'exercice.`;
  }
  return `${activeTense.value.label} est visible pour preparer la suite du module, mais le contenu n'est pas encore disponible.`;
});

function selectFamilyDefault(family) {
  if (!family?.defaultTenseKey) {
    return;
  }
  selectedTense.value = family.defaultTenseKey;
}

function syncFromRoute(query) {
  selectedVerb.value = resolveVerbKey(query.verb);
  selectedTense.value = resolveTenseKey(query.tense);
  selectedMood.value =
    typeof query.mood === 'string' && query.mood ? query.mood : DEFAULT_MOOD_KEY;
}

watch(
  () => route.query,
  (query) => {
    syncFromRoute(query);
  }
);

watch(
  [selectedVerb, selectedTense, selectedMood],
  ([verbKey, tenseKey, moodKey]) => {
    const nextQuery = buildFrenchWorkspaceQuery(verbKey, tenseKey, moodKey);
    const currentQuery = buildFrenchWorkspaceQuery(
      route.query.verb,
      route.query.tense,
      typeof route.query.mood === 'string' ? route.query.mood : DEFAULT_MOOD_KEY,
      typeof route.query.mode === 'string' ? route.query.mode : DEFAULT_MODE_KEY
    );

    if (JSON.stringify(nextQuery) === JSON.stringify(currentQuery)) {
      return;
    }

    router.replace({
      name: 'languages-french',
      query: nextQuery,
    });
  }
);

function openQcm() {
  if (!selectedVerb.value || !tenseAvailable.value) {
    return;
  }

  router.push({
    name: 'languages-french-qcm',
    params: { verbKey: selectedVerb.value },
    query: buildFrenchWorkspaceQuery(selectedVerb.value, selectedTense.value, selectedMood.value, 'qcm'),
  });
}

function openInput() {
  if (!selectedVerb.value || !tenseAvailable.value) {
    return;
  }

  router.push({
    name: 'languages-french-input',
    params: { verbKey: selectedVerb.value },
    query: buildFrenchWorkspaceQuery(selectedVerb.value, selectedTense.value, selectedMood.value, 'input'),
  });
}

function openFlashcards() {
  if (!selectedVerb.value || !tenseAvailable.value) {
    return;
  }

  router.push({
    name: 'languages-french-flashcards',
    params: { verbKey: selectedVerb.value },
    query: buildFrenchWorkspaceQuery(
      selectedVerb.value,
      selectedTense.value,
      selectedMood.value,
      'flashcards'
    ),
  });
}
</script>

<template>
  <section class="page-block french-hub">
    <div class="section-block">
      <h1>🇫🇷 Français</h1>
      <p class="hub-intro">
        Révise la conjugaison française avec tableaux, flashcards et exercices progressifs.
      </p>
    </div>

    <section class="page-block section-block french-hub__settings">
      <div class="french-hub__settings-grid">
        <QuizSelectField
          v-model="selectedVerb"
          select-id="frenchHubVerbSelect"
          label="Choisir un verbe :"
          :options="verbOptions"
        />

        <div class="quiz-select-field">
          <label class="quiz-select-label" for="frenchHubTenseSelect">Choisir un temps :</label>
          <select
            id="frenchHubTenseSelect"
            class="quiz-select-control"
            :value="selectedTense"
            @change="selectedTense = $event.target.value"
          >
            <optgroup v-for="family in tenseFamilies" :key="family.key" :label="family.label">
              <option
                v-for="option in family.options"
                :key="option.key"
                :value="option.key"
                :disabled="!option.available"
              >
                {{ option.available ? option.label : `${option.label} (bientot)` }}
              </option>
            </optgroup>
          </select>
        </div>
      </div>

      <div class="french-hub__bands">
        <button
          v-for="family in tenseFamilies"
          :key="family.key"
          class="french-hub__band"
          :class="[
            `is-${family.familyKey}`,
            {
              'is-active': activeFamilyKey === family.familyKey,
              'is-disabled': !family.options.some((option) => option.available),
            },
          ]"
          type="button"
          @click="selectFamilyDefault(family)"
        >
          <strong>{{ family.label }}</strong>
          <span>
            {{
              family.options
                .map((option) => (option.available ? option.label : `${option.label} (bientot)`))
                .join(' · ')
            }}
          </span>
        </button>
      </div>
    </section>

    <section class="page-block french-hub__table-card">
      <div class="french-hub__table-head">
        <div>
          <h2>Tableau actif</h2>
          <p>Tout reste centré autour de la fiche active, puis tu lances un mode d'exercice.</p>
        </div>
        <span v-if="activePillLabel" class="french-hub__pill">{{ activePillLabel }}</span>
      </div>

      <p class="french-hub__helper">
        <strong>Sélection du temps :</strong>
        {{ timeHelperText }}
      </p>

      <div v-if="tenseAvailable" class="conjugation-table" role="table" aria-label="Tableau de conjugaison">
        <div v-for="row in rows" :key="row.key" class="conjugation-row" role="row">
          <div class="conjugation-label" role="rowheader">{{ row.label }}</div>
          <div class="conjugation-values" role="cell">{{ row.forms.join(' • ') }}</div>
        </div>
      </div>

      <div v-else class="french-hub__coming-soon">
        <h3>Temps non disponible</h3>
        <p>
          Le présent est disponible maintenant. Les temps passé et futur restent cliquables pour
          préparer la suite du module, mais leurs tableaux et exercices ne sont pas encore ouverts.
        </p>
      </div>

      <div class="french-hub__modes">
        <button
          class="home-card french-hub__mode-card"
          :class="{ 'is-disabled': !tenseAvailable }"
          type="button"
          :disabled="!tenseAvailable"
          @click="openFlashcards"
        >
          <h3>🃏 Flashcards</h3>
          <p>Révision visuelle des formes.</p>
        </button>

        <button
          class="home-card french-hub__mode-card"
          :class="{ 'is-disabled': !tenseAvailable }"
          type="button"
          :disabled="!tenseAvailable"
          @click="openQcm"
        >
          <h3>✅ QCM</h3>
          <p>Reconnaître rapidement la bonne conjugaison.</p>
        </button>

        <button
          class="home-card french-hub__mode-card"
          :class="{ 'is-disabled': !tenseAvailable }"
          type="button"
          :disabled="!tenseAvailable"
          @click="openInput"
        >
          <h3>⌨️ Saisie</h3>
          <p>Valider vraiment la mémorisation.</p>
        </button>
      </div>
    </section>
  </section>
</template>

<style scoped>
.french-hub {
  display: grid;
  gap: 18px;
}

.french-hub__settings {
  display: grid;
  gap: 16px;
}

.french-hub__settings-grid {
  display: grid;
  gap: 12px;
}

.quiz-select-label {
  display: block;
  margin: 0 0 8px;
  font-weight: 700;
}

.quiz-select-control {
  width: 100%;
  min-height: 44px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #9ab0c8;
  background: #fbfdff;
  color: #17304d;
}

.quiz-select-control:focus-visible {
  border-color: #1d4ed8;
  box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.16);
  outline: none;
}

.french-hub__bands {
  display: grid;
  gap: 10px;
}

.french-hub__band {
  display: grid;
  gap: 4px;
  text-align: left;
  border: 1px solid rgba(140, 167, 193, 0.35);
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(245, 248, 252, 0.92);
  color: #17304d;
  cursor: pointer;
  opacity: 0.78;
  transition:
    opacity 0.16s ease,
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.french-hub__band strong {
  font-size: 0.98rem;
}

.french-hub__band span {
  color: #4b647d;
  line-height: 1.45;
}

.french-hub__band.is-active {
  opacity: 1;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(22, 49, 77, 0.08);
}

.french-hub__band.is-present {
  background: #eaf8ef;
}

.french-hub__band.is-past {
  background: #fff4dc;
}

.french-hub__band.is-future {
  background: #e9f4ff;
}

.french-hub__band.is-disabled {
  cursor: pointer;
  opacity: 0.6;
}

.french-hub__table-card {
  display: grid;
  gap: 16px;
  background: rgba(255, 255, 255, 0.96);
}

.french-hub__table-head {
  display: grid;
  gap: 10px;
}

.french-hub__table-head h2 {
  margin: 0;
}

.french-hub__table-head p {
  margin: 6px 0 0;
  color: #4b647d;
}

.french-hub__pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  width: fit-content;
  padding: 0 12px;
  border-radius: 999px;
  background: #eaf8ef;
  border: 1px solid #b6d9bf;
  font-weight: 800;
}

.french-hub__helper {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px dashed rgba(140, 167, 193, 0.45);
  background: rgba(248, 251, 255, 0.96);
  color: #4b647d;
  line-height: 1.5;
}

.french-hub__helper strong {
  color: #17304d;
}

.conjugation-table {
  display: grid;
  gap: 10px;
}

.conjugation-row {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(140, 167, 193, 0.35);
  background: rgba(245, 248, 252, 0.92);
}

.conjugation-label {
  font-weight: 800;
  color: #17304d;
}

.conjugation-values {
  color: #2b4461;
  line-height: 1.5;
}

.french-hub__coming-soon {
  border: 1px dashed rgba(140, 167, 193, 0.45);
  border-radius: 14px;
  padding: 18px;
  background: rgba(248, 251, 255, 0.96);
}

.french-hub__coming-soon h3 {
  margin: 0 0 8px;
}

.french-hub__coming-soon p {
  margin: 0;
  color: #4b647d;
  line-height: 1.5;
}

.french-hub__modes {
  display: grid;
  gap: 12px;
}

.french-hub__mode-card {
  width: 100%;
  text-align: left;
  border: 0;
  cursor: pointer;
}

.french-hub__mode-card h3 {
  margin: 0 0 8px;
}

.french-hub__mode-card p {
  margin: 0;
}

.french-hub__mode-card.is-disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

@media (min-width: 900px) {
  .french-hub__settings-grid {
    grid-template-columns: 1fr 1fr;
  }

  .french-hub__bands {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .french-hub__table-head {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .conjugation-row {
    grid-template-columns: 190px minmax(0, 1fr);
    align-items: center;
  }

  .french-hub__modes {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
