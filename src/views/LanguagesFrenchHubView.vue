<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import FrenchFlashcardsPanel from '@/components/french/FrenchFlashcardsPanel.vue';
import FrenchInputPanel from '@/components/french/FrenchInputPanel.vue';
import FrenchQcmPanel from '@/components/french/FrenchQcmPanel.vue';
import FrenchTablePanel from '@/components/french/FrenchTablePanel.vue';
import QuizSelectField from '@/components/QuizSelectField.vue';
import {
  getFrenchInflectionModule,
  getFrenchTense,
  getFrenchVerb,
  isFrenchTenseAvailable,
  listFrenchTenseFamilies,
  listFrenchVerbOptions,
} from '@/features/languages/frenchConjugations';

const DEFAULT_MOOD_KEY = 'indicatif';
const DEFAULT_MODE_KEY = 'table';
const FRENCH_WORKSPACE_STORAGE_KEY = 'manabuplay_french_workspace';

const route = useRoute();
const router = useRouter();
const frenchSource = getFrenchInflectionModule();
const verbOptions = listFrenchVerbOptions(frenchSource).filter((option) => option.value !== 'manabuer');
const tenseFamilies = listFrenchTenseFamilies(frenchSource);

const validVerbKeys = new Set(verbOptions.map((option) => option.value));
const validTenseKeys = new Set(
  tenseFamilies.flatMap((family) => family.options.map((option) => option.key))
);
const validModeKeys = new Set(['table', 'flashcards', 'qcm', 'input']);

function resolveVerbKey(value) {
  return typeof value === 'string' && validVerbKeys.has(value)
    ? value
    : (verbOptions[0]?.value ?? '');
}

function resolveTenseKey(value) {
  return typeof value === 'string' && validTenseKeys.has(value) ? value : 'present';
}

function readStoredWorkspace() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(FRENCH_WORKSPACE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const initialWorkspace = readStoredWorkspace();
const selectedVerb = ref(resolveVerbKey(route.query.verb || initialWorkspace?.verb));
const selectedTense = ref(resolveTenseKey(route.query.tense || initialWorkspace?.tense));
const selectedMood = ref(
  typeof (route.query.mood || initialWorkspace?.mood) === 'string' &&
    (route.query.mood || initialWorkspace?.mood)
    ? route.query.mood || initialWorkspace?.mood
    : DEFAULT_MOOD_KEY
);
const selectedMode = ref(
  typeof (route.query.mode || initialWorkspace?.mode) === 'string' &&
    validModeKeys.has(route.query.mode || initialWorkspace?.mode)
    ? route.query.mode || initialWorkspace?.mode
    : DEFAULT_MODE_KEY
);

const activeVerb = computed(() =>
  getFrenchVerb(selectedVerb.value, frenchSource, selectedMood.value, selectedTense.value)
);
const activeTense = computed(() =>
  getFrenchTense(selectedTense.value, frenchSource, selectedMood.value)
);
const tenseAvailable = computed(() =>
  isFrenchTenseAvailable(selectedTense.value, frenchSource, selectedMood.value)
);
const activeFamilyKey = computed(() => activeTense.value?.familyKey || 'present');
const activePanelComponent = computed(() => {
  if (selectedMode.value === 'flashcards') {
    return FrenchFlashcardsPanel;
  }
  if (selectedMode.value === 'qcm') {
    return FrenchQcmPanel;
  }
  if (selectedMode.value === 'input') {
    return FrenchInputPanel;
  }
  return FrenchTablePanel;
});
const modeOptions = Object.freeze([
  { key: 'table', label: '📖 Tableau', description: 'Voir la fiche active.' },
  { key: 'flashcards', label: '🃏 Flashcards', description: 'Révision visuelle des formes.' },
  { key: 'qcm', label: '✅ QCM', description: 'Reconnaître rapidement la bonne conjugaison.' },
  { key: 'input', label: '⌨️ Saisie', description: 'Valider vraiment la mémorisation.' },
]);
const visibleModeOptions = computed(() =>
  modeOptions.filter((mode) => mode.key !== selectedMode.value)
);

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
    return `Le temps ${activeTense.value.label.toLowerCase()} est disponible pour la fiche et les quatre vues du module.`;
  }
  return `${activeTense.value.label} est visible pour preparer la suite du module, mais le contenu n'est pas encore disponible.`;
});

function selectFamilyDefault(family) {
  if (!family?.defaultTenseKey) {
    return;
  }
  selectedTense.value = family.defaultTenseKey;
}

function writeStoredWorkspace() {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    verb: selectedVerb.value,
    tense: selectedTense.value,
    mood: selectedMood.value,
    mode: selectedMode.value,
  };

  try {
    window.sessionStorage.setItem(FRENCH_WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
    window.history.replaceState(
      {
        ...(window.history.state || {}),
        frenchWorkspace: payload,
      },
      '',
      route.path
    );
  } catch {
    // Ignore storage/history failures.
  }
}

onMounted(() => {
  if (Object.keys(route.query).length > 0) {
    router.replace({ name: 'languages-french' });
  }
});

onBeforeRouteLeave((to) => {
  if (to.name !== 'languages-french') {
    selectedMode.value = DEFAULT_MODE_KEY;
    writeStoredWorkspace();
  }
  return true;
});

watch(
  [selectedVerb, selectedTense, selectedMood, selectedMode],
  () => {
    writeStoredWorkspace();
  },
  { immediate: true }
);

function setMode(modeKey) {
  if (!validModeKeys.has(modeKey)) {
    return;
  }
  if (modeKey !== 'table' && !tenseAvailable.value) {
    return;
  }
  selectedMode.value = modeKey;
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
          <h2>Workspace actif</h2>
          <p>Le verbe, le temps et le mode restent en place pendant toute la révision.</p>
        </div>
        <span v-if="activePillLabel" class="french-hub__pill">{{ activePillLabel }}</span>
      </div>

      <p class="french-hub__helper">
        <strong>Sélection du temps :</strong>
        {{ timeHelperText }}
      </p>

      <div class="french-hub__modes">
        <button
          v-for="mode in visibleModeOptions"
          :key="mode.key"
          class="home-card french-hub__mode-card"
          :class="{
            'is-active': selectedMode === mode.key,
            'is-disabled': mode.key !== 'table' && !tenseAvailable,
          }"
          type="button"
          :disabled="mode.key !== 'table' && !tenseAvailable"
          @click="setMode(mode.key)"
        >
          <h3>{{ mode.label }}</h3>
          <p>{{ mode.description }}</p>
        </button>
      </div>

      <div v-if="!tenseAvailable" class="french-hub__coming-soon">
        <h3>Temps non disponible</h3>
        <p>
          Le présent est disponible maintenant. Les temps passé et futur restent cliquables pour
          préparer la suite du module, mais leurs tableaux et exercices ne sont pas encore ouverts.
        </p>
      </div>

      <div v-if="tenseAvailable" class="french-hub__panel" :class="`is-mode-${selectedMode}`">
        <component
          :is="activePanelComponent"
          :verb-key="selectedVerb"
          :mood-key="selectedMood"
          :tense-key="selectedTense"
          :source="frenchSource"
        />
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

.french-hub__panel {
  min-width: 0;
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

@media (max-width: 767px) {
  .french-hub__panel.is-mode-flashcards {
    margin-inline: -17px;
  }
}
</style>
