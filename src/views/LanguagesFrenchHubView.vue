<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import FrenchFlashcardsPanel from '@/components/french/FrenchFlashcardsPanel.vue';
import FrenchInputPanel from '@/components/french/FrenchInputPanel.vue';
import FrenchQcmPanel from '@/components/french/FrenchQcmPanel.vue';
import FrenchTablePanel from '@/components/french/FrenchTablePanel.vue';
import QuizSelectField from '@/components/QuizSelectField.vue';
import { createFrenchModeSessionStore } from '@/features/languages/frenchConjugationSessionStore';
import {
  getFrenchInflectionModule,
  getFrenchTense,
  isFrenchVerbTenseAvailable,
  listFrenchTenseFamilies,
  listFrenchVerbOptionGroups,
  listFrenchVerbOptions,
} from '@/features/languages/frenchConjugations';

const DEFAULT_MOOD_KEY = 'indicatif';
const DEFAULT_MODE_KEY = 'table';
const FRENCH_WORKSPACE_STORAGE_KEY = 'manabuplay_french_workspace';

const route = useRoute();
const router = useRouter();
const frenchSource = getFrenchInflectionModule();
const verbOptions = listFrenchVerbOptions(frenchSource).filter((option) => option.value !== 'manabuer');
const verbOptionGroups = computed(() =>
  listFrenchVerbOptionGroups(frenchSource)
    .map((group) => ({
      ...group,
      options: (group.options || []).filter((option) => option.value !== 'manabuer'),
    }))
    .filter((group) => group.options.length > 0)
);
const tenseFamilies = listFrenchTenseFamilies(frenchSource);

const validVerbKeys = new Set(verbOptions.map((option) => option.value));
const validTenseKeys = new Set(
  tenseFamilies.flatMap((family) => family.options.map((option) => option.key))
);
const validModeKeys = new Set(['table', 'flashcards', 'qcm', 'input']);

const modeOptions = Object.freeze([
  {
    key: 'flashcards',
    label: '🃏 Flashcards',
    description: 'Révision visuelle des formes.',
  },
  {
    key: 'qcm',
    label: '✅ QCM',
    description: 'Choisir la bonne conjugaison.',
  },
  {
    key: 'input',
    label: '✍️ Réponse libre',
    description: 'Saisir la conjugaison correcte.',
  },
]);
const tenseOptionGroups = computed(() =>
  tenseFamilies.map((family) => ({
    key: family.key,
    label: family.label,
    options: family.options.map((option) => ({
      value: option.key,
      label: option.available ? option.label : `${option.label} (bientôt)`,
      disabled: !option.available,
    })),
  }))
);

function toShortTenseLabel(label) {
  return typeof label === 'string' ? label.replace(/^[A-Za-zÀ-ÿ-]+\s+/, '') : '';
}

function resolveVerbKey(value) {
  return typeof value === 'string' && validVerbKeys.has(value) ? value : '';
}

function resolveTenseKey(value) {
  return typeof value === 'string' && validTenseKeys.has(value) ? value : '';
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
const selectedVerb = ref(resolveVerbKey(route.query.verb || initialWorkspace?.verb || ''));
const selectedTense = ref(resolveTenseKey(route.query.tense || initialWorkspace?.tense || ''));
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
const scoreSummary = ref({
  qcm: { bestScore: 0, bestStreak: 0 },
  input: { bestScore: 0, bestStreak: 0 },
});

const activeTense = computed(() =>
  selectedTense.value ? getFrenchTense(selectedTense.value, frenchSource, selectedMood.value) : null
);
const hasCompleteSelection = computed(() => Boolean(selectedVerb.value && selectedTense.value));
const tenseAvailable = computed(() =>
  hasCompleteSelection.value
    ? isFrenchVerbTenseAvailable(
        selectedVerb.value,
        selectedTense.value,
        frenchSource,
        selectedMood.value
      )
    : false
);
const activeFamilyKey = computed(() => activeTense.value?.familyKey || '');
const tableState = computed(() => {
  if (!hasCompleteSelection.value) {
    return 'setup';
  }
  if (!tenseAvailable.value) {
    return 'unavailable';
  }
  if (selectedMode.value !== 'table') {
    return 'exercise';
  }
  return 'table';
});
const tableLocked = computed(() => tableState.value !== 'table');
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
  return null;
});
const activePillLabel = computed(() => {
  if (!activeTense.value || !selectedVerb.value) {
    return '';
  }
  const activeOption = verbOptions.find((option) => option.value === selectedVerb.value);
  return activeOption ? `${activeOption.label} · ${toShortTenseLabel(activeTense.value.label)}` : '';
});

const timeHelperText = computed(() => {
  if (!hasCompleteSelection.value) {
    return 'Choisir un verbe et un temps pour commencer.';
  }
  if (activeTense.value && tenseAvailable.value) {
    return `${toShortTenseLabel(activeTense.value.label)} est disponible pour la fiche et les exercices du module.`;
  }
  return activeTense.value
    ? `${toShortTenseLabel(activeTense.value.label)} n'est pas encore disponible pour ce verbe.`
    : 'Choisir un temps.';
});

function refreshScoreSummary() {
  scoreSummary.value = {
    qcm: {
      bestScore: createFrenchModeSessionStore(
        'qcm',
        selectedVerb.value,
        selectedMood.value,
        selectedTense.value
      ).readBestScore(),
      bestStreak: createFrenchModeSessionStore(
        'qcm',
        selectedVerb.value,
        selectedMood.value,
        selectedTense.value
      ).readBestStreak(),
    },
    input: {
      bestScore: createFrenchModeSessionStore(
        'input',
        selectedVerb.value,
        selectedMood.value,
        selectedTense.value
      ).readBestScore(),
      bestStreak: createFrenchModeSessionStore(
        'input',
        selectedVerb.value,
        selectedMood.value,
        selectedTense.value
      ).readBestStreak(),
    },
  };
}

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

function clearStoredWorkspace() {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.removeItem(FRENCH_WORKSPACE_STORAGE_KEY);
    window.history.replaceState(
      {
        ...(window.history.state || {}),
        frenchWorkspace: null,
      },
      '',
      route.path
    );
  } catch {
    // Ignore storage/history failures.
  }
}

function setMode(modeKey) {
  if (!validModeKeys.has(modeKey) || modeKey === 'table') {
    return;
  }
  if (!hasCompleteSelection.value || !tenseAvailable.value) {
    return;
  }
  selectedMode.value = modeKey;
}

function showTable() {
  selectedMode.value = DEFAULT_MODE_KEY;
  refreshScoreSummary();
}

onMounted(() => {
  if (Object.keys(route.query).length > 0) {
    router.replace({ name: 'languages-french' });
  }
  refreshScoreSummary();
});

onBeforeRouteLeave((to) => {
  if (to.name !== 'languages-french') {
    selectedMode.value = DEFAULT_MODE_KEY;
    selectedVerb.value = '';
    selectedTense.value = '';
    clearStoredWorkspace();
  }
  return true;
});

watch(
  [selectedVerb, selectedTense, selectedMood, selectedMode],
  () => {
    if ((!hasCompleteSelection.value || !tenseAvailable.value) && selectedMode.value !== DEFAULT_MODE_KEY) {
      selectedMode.value = DEFAULT_MODE_KEY;
      return;
    }
    writeStoredWorkspace();
    refreshScoreSummary();
  },
  { immediate: true }
);
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
      <div class="french-hub__workspace-grid">
        <div class="french-hub__controls">
          <div class="french-hub__settings-grid">
            <QuizSelectField
              v-model="selectedVerb"
              select-id="frenchHubVerbSelect"
              label="Choisir un verbe :"
              placeholder="-- Choisir un verbe --"
              :option-groups="verbOptionGroups"
            />

            <QuizSelectField
              v-model="selectedTense"
              select-id="frenchHubTenseSelect"
              label="Choisir un temps :"
              placeholder="-- Choisir un temps --"
              :option-groups="tenseOptionGroups"
            />
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
                  family.options.map((option) => toShortTenseLabel(option.label)).join(' · ')
                }}
              </span>
            </button>
          </div>

          <p class="french-hub__helper">
            <strong>Choix du temps :</strong>
            {{ timeHelperText }}
          </p>
        </div>

        <section class="page-block french-hub__table-card">
          <div class="french-hub__table-head">
            <div>
              <h2>Conjugaison</h2>
            </div>
            <span v-if="activePillLabel" class="french-hub__pill">{{ activePillLabel }}</span>
          </div>

          <div class="french-hub__table-wrap" :class="{ 'is-locked': tableLocked }">
            <div class="french-hub__table-content">
              <FrenchTablePanel
                v-if="hasCompleteSelection && tenseAvailable"
                :verb-key="selectedVerb"
                :mood-key="selectedMood"
                :tense-key="selectedTense"
                :source="frenchSource"
              />
              <div v-else class="french-hub__table-placeholder" aria-hidden="true"></div>
            </div>

            <div v-if="tableLocked" class="french-hub__table-overlay">
              <div class="french-hub__table-overlay-card">
                <template v-if="tableState === 'setup'">
                  <h3>Choisir un verbe et un temps pour commencer.</h3>
                  <p>La conjugaison et les exercices apparaîtront ensuite.</p>
                </template>
                <template v-else-if="tableState === 'unavailable'">
                  <h3>Ce temps n'est pas disponible pour ce verbe.</h3>
                  <p>Choisir un autre verbe ou un autre temps.</p>
                </template>
                <template v-else>
                  <h3>Le tableau est masqué pendant l'exercice.</h3>
                  <p>L'afficher mettra fin à la série en cours.</p>
                  <button type="button" @click="showTable">Afficher la conjugaison</button>
                </template>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section class="page-block french-hub__exercise-card">
      <div class="french-hub__modes">
        <button
          v-for="mode in modeOptions"
          :key="mode.key"
          class="home-card french-hub__mode-card"
          :class="{
            'is-active': selectedMode === mode.key,
            'is-disabled': !hasCompleteSelection || !tenseAvailable,
          }"
          type="button"
          :disabled="!hasCompleteSelection || !tenseAvailable"
          @click="setMode(mode.key)"
        >
          <h3>{{ mode.label }}</h3>
          <p>{{ mode.description }}</p>
          <div class="french-hub__score-list">
            <template v-if="mode.key === 'qcm'">
              <span class="french-hub__score-chip">Meilleur score : {{ scoreSummary.qcm.bestScore }}</span>
              <span class="french-hub__score-chip">Meilleure série : {{ scoreSummary.qcm.bestStreak }}</span>
            </template>
            <template v-else-if="mode.key === 'input'">
              <span class="french-hub__score-chip">Meilleur score : {{ scoreSummary.input.bestScore }}</span>
              <span class="french-hub__score-chip">Meilleure série : {{ scoreSummary.input.bestStreak }}</span>
            </template>
          </div>
        </button>
      </div>

      <div
        v-if="selectedMode === 'table' && hasCompleteSelection && tenseAvailable"
        class="french-hub__exercise-empty"
      >
        <p>Choisir un mode d'entraînement.</p>
      </div>

      <div v-else-if="selectedMode !== 'table' && hasCompleteSelection && tenseAvailable" class="french-hub__panel" :class="`is-mode-${selectedMode}`">
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

.french-hub__settings,
.french-hub__exercise-card,
.french-hub__controls,
.french-hub__workspace-grid {
  display: grid;
  gap: 16px;
}

.french-hub__settings-grid {
  display: grid;
  gap: 12px;
}

.french-hub__bands {
  display: grid;
  gap: 10px;
}

.french-hub__band {
  display: grid;
  gap: 3px;
  text-align: left;
  border: 1px solid rgba(140, 167, 193, 0.35);
  border-radius: 14px;
  padding: 10px 12px;
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
  font-size: 0.95rem;
}

.french-hub__band span {
  color: #4b647d;
  font-size: 0.88rem;
  line-height: 1.3;
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

.french-hub__table-card {
  display: grid;
  gap: 16px;
  margin: 0;
  background: rgba(255, 255, 255, 0.96);
}

.french-hub__table-head {
  display: grid;
  gap: 10px;
}

.french-hub__table-head h2,
.french-hub__table-head p {
  margin: 0;
}

.french-hub__table-head p {
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

.french-hub__table-wrap {
  position: relative;
}

.french-hub__table-content {
  transition:
    filter 0.18s ease,
    opacity 0.18s ease;
}

.french-hub__table-placeholder {
  min-height: 320px;
  border-radius: 16px;
  border: 1px dashed rgba(140, 167, 193, 0.4);
  background:
    linear-gradient(180deg, rgba(249, 252, 255, 0.98), rgba(243, 248, 255, 0.96)),
    repeating-linear-gradient(
      180deg,
      transparent 0,
      transparent 42px,
      rgba(140, 167, 193, 0.08) 42px,
      rgba(140, 167, 193, 0.08) 43px
    );
}

.french-hub__table-wrap.is-locked .french-hub__table-content {
  filter: blur(7px);
  opacity: 0.42;
  pointer-events: none;
  user-select: none;
}

.french-hub__table-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 2;
}

.french-hub__table-overlay-card {
  width: min(360px, 100%);
  display: grid;
  gap: 10px;
  padding: 18px;
  text-align: center;
  border-radius: 18px;
  border: 1px solid rgba(181, 198, 220, 0.7);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 26px rgba(36, 48, 65, 0.16);
}

.french-hub__table-overlay-card h3,
.french-hub__table-overlay-card p {
  margin: 0;
}

.french-hub__table-overlay-card p {
  color: #4b647d;
  line-height: 1.45;
}

.french-hub__table-overlay-card button {
  min-height: 42px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #6d5ef2, #8073ff);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.french-hub__modes {
  display: grid;
  gap: 12px;
}

.french-hub__mode-card {
  width: 100%;
  border: 0;
  text-align: left;
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

.french-hub__score-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
}

.french-hub__score-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef4fb;
  border: 1px solid #d4e2f3;
  color: #2d4565;
  font-size: 0.88rem;
  font-weight: 700;
}

.french-hub__coming-soon {
  border: 1px dashed rgba(140, 167, 193, 0.45);
  border-radius: 14px;
  padding: 18px;
  background: rgba(248, 251, 255, 0.96);
}

.french-hub__coming-soon h3,
.french-hub__coming-soon p {
  margin: 0;
}

.french-hub__coming-soon p {
  margin-top: 8px;
  color: #4b647d;
  line-height: 1.5;
}

.french-hub__exercise-empty {
  padding: 6px 2px 0;
  text-align: center;
  color: #4b647d;
}

.french-hub__exercise-empty p {
  margin: 0;
}

.french-hub__panel {
  min-width: 0;
}

@media (min-width: 900px) {
  .french-hub__workspace-grid {
    grid-template-columns: 1.02fr 1.18fr;
    align-items: start;
  }

  .french-hub__settings-grid {
    grid-template-columns: 1fr 1fr;
  }

  .french-hub__bands,
  .french-hub__modes {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .french-hub__table-head {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }
}

@media (max-width: 767px) {
  .french-hub__panel.is-mode-flashcards {
    margin-inline: -17px;
  }
}
</style>
