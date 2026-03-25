<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import FrenchFlashcardsPanel from '@/components/french/FrenchFlashcardsPanel.vue';
import FrenchInputPanel from '@/components/french/FrenchInputPanel.vue';
import FrenchQcmPanel from '@/components/french/FrenchQcmPanel.vue';
import FrenchTablePanel from '@/components/french/FrenchTablePanel.vue';
import QuizSelectField from '@/components/QuizSelectField.vue';
import { createFrenchModeSessionStore } from '@/features/languages/frenchConjugationSessionStore';
import {
  getFrenchInflectionModule,
  hydrateRemoteFrenchConjugationModule,
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
const initialFrenchSource = getFrenchInflectionModule();
const initialVerbOptions = listFrenchVerbOptions(initialFrenchSource).filter(
  (option) => option.value !== 'manabuer'
);
const initialTenseFamilies = listFrenchTenseFamilies(initialFrenchSource);
const initialValidVerbKeys = new Set(initialVerbOptions.map((option) => option.value));
const initialValidTenseKeys = new Set(
  initialTenseFamilies.flatMap((family) => family.options.map((option) => option.key))
);
const frenchSource = ref(initialFrenchSource);
const verbOptions = computed(() =>
  listFrenchVerbOptions(frenchSource.value).filter((option) => option.value !== 'manabuer')
);
const verbOptionGroups = computed(() =>
  listFrenchVerbOptionGroups(frenchSource.value)
    .map((group) => ({
      ...group,
      options: (group.options || []).filter((option) => option.value !== 'manabuer'),
    }))
    .filter((group) => group.options.length > 0)
);
const tenseFamilies = computed(() => listFrenchTenseFamilies(frenchSource.value));

const validVerbKeys = computed(() => new Set(verbOptions.value.map((option) => option.value)));
const validTenseKeys = computed(
  () => new Set(tenseFamilies.value.flatMap((family) => family.options.map((option) => option.key)))
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
  tenseFamilies.value.map((family) => ({
    key: family.key,
    label: family.label,
    options: family.options.map((option) => ({
      value: option.key,
      label: option.available
        ? capitalizeLabel(toShortTenseLabel(option.label))
        : `${capitalizeLabel(toShortTenseLabel(option.label))} (bientôt)`,
      disabled: !option.available,
    })),
  }))
);

function toShortTenseLabel(label) {
  return typeof label === 'string' ? label.replace(/^[A-Za-zÀ-ÿ-]+\s+/, '') : '';
}

function capitalizeLabel(label) {
  if (typeof label !== 'string' || !label) {
    return '';
  }
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function resolveVerbKey(value) {
  return typeof value === 'string' && validVerbKeys.value.has(value) ? value : '';
}

function resolveTenseKey(value) {
  return typeof value === 'string' && validTenseKeys.value.has(value) ? value : '';
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
const selectedVerb = ref(
  typeof (route.query.verb || initialWorkspace?.verb) === 'string' &&
    initialValidVerbKeys.has(route.query.verb || initialWorkspace?.verb)
    ? route.query.verb || initialWorkspace?.verb
    : ''
);
const selectedTense = ref(
  typeof (route.query.tense || initialWorkspace?.tense) === 'string' &&
    initialValidTenseKeys.has(route.query.tense || initialWorkspace?.tense)
    ? route.query.tense || initialWorkspace?.tense
    : ''
);
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
const controlsHighlight = ref(false);
const controlsHighlightTimeoutId = ref(null);
const exerciseSection = ref(null);
const verbSelectField = ref(null);
const tenseSelectField = ref(null);

const activeTense = computed(() =>
  selectedTense.value ? getFrenchTense(selectedTense.value, frenchSource.value, selectedMood.value) : null
);
const hasCompleteSelection = computed(() => Boolean(selectedVerb.value && selectedTense.value));
const tenseAvailable = computed(() =>
  hasCompleteSelection.value
    ? isFrenchVerbTenseAvailable(
        selectedVerb.value,
        selectedTense.value,
        frenchSource.value,
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
  const activeOption = verbOptions.value.find((option) => option.value === selectedVerb.value);
  return activeOption ? `${activeOption.label} · ${toShortTenseLabel(activeTense.value.label)}` : '';
});

function getFamilySummary(family) {
  if (family.familyKey === 'present') {
    return 'présent';
  }
  if (family.familyKey === 'past') {
    return '5 temps';
  }
  if (family.familyKey === 'future') {
    return '2 temps';
  }
  return family.options.map((option) => toShortTenseLabel(option.label)).join(' · ');
}

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

function clearControlsHighlightTimeout() {
  if (controlsHighlightTimeoutId.value) {
    clearTimeout(controlsHighlightTimeoutId.value);
    controlsHighlightTimeoutId.value = null;
  }
}

function focusRelevantSelect() {
  const targetRef = !selectedVerb.value ? verbSelectField.value : tenseSelectField.value;
  const selectElement = targetRef?.querySelector?.('select');
  selectElement?.focus();
}

function guideToSelectors() {
  clearControlsHighlightTimeout();
  controlsHighlight.value = false;
  nextTick(() => {
    controlsHighlight.value = true;
    controlsHighlightTimeoutId.value = setTimeout(() => {
      controlsHighlight.value = false;
      controlsHighlightTimeoutId.value = null;
    }, 900);
    focusRelevantSelect();
  });
}

function scrollToExercise() {
  nextTick(() => {
    const target = exerciseSection.value;
    if (!target || typeof window === 'undefined') {
      return;
    }
    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const centeredTop = window.scrollY + rect.top - Math.max((viewportHeight - rect.height) / 2, 24);
    const top = Math.max(centeredTop, 0);
    window.scrollTo({
      top,
      behavior: 'smooth',
    });
  });
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
  scrollToExercise();
}

function showTable() {
  selectedMode.value = DEFAULT_MODE_KEY;
  refreshScoreSummary();
}

function handleTableOverlayClick() {
  if (tableState.value === 'exercise') {
    return;
  }
  guideToSelectors();
}

onMounted(() => {
  if (Object.keys(route.query).length > 0) {
    router.replace({ name: 'languages-french' });
  }
  refreshScoreSummary();
  hydrateRemoteFrenchConjugationModule().then((result) => {
    if (result?.updated) {
      frenchSource.value = getFrenchInflectionModule();
    }
  });
});

onUnmounted(() => {
  clearControlsHighlightTimeout();
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
  frenchSource,
  () => {
    if (selectedVerb.value && !validVerbKeys.value.has(selectedVerb.value)) {
      selectedVerb.value = '';
    }
    if (selectedTense.value && !validTenseKeys.value.has(selectedTense.value)) {
      selectedTense.value = '';
    }
  },
  { deep: false }
);

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
      <div class="french-hub__header">
        <h1>Conjugaison française</h1>
        <p class="hub-intro">
          Choisis un verbe, un temps, puis un entraînement.
        </p>
      </div>
    </div>

    <section class="page-block section-block french-hub__settings">
      <div class="french-hub__workspace-grid">
        <div class="french-hub__controls">
          <div class="french-hub__settings-grid">
            <div
              ref="verbSelectField"
              class="french-hub__select-field"
              :class="{ 'is-guided': controlsHighlight }"
            >
              <QuizSelectField
                v-model="selectedVerb"
                select-id="frenchHubVerbSelect"
                label="Choisir un verbe :"
                placeholder="-- Choisir un verbe --"
                :option-groups="verbOptionGroups"
              />
            </div>

            <div
              ref="tenseSelectField"
              class="french-hub__select-field"
              :class="{ 'is-guided': controlsHighlight }"
            >
              <QuizSelectField
                v-model="selectedTense"
                select-id="frenchHubTenseSelect"
                label="Choisir un temps :"
                placeholder="-- Choisir un temps --"
                :option-groups="tenseOptionGroups"
              />
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
              <span>{{ getFamilySummary(family) }}</span>
            </button>
          </div>
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

            <div
              v-if="tableLocked"
              class="french-hub__table-overlay"
              @click="handleTableOverlayClick"
            >
              <div
                class="french-hub__table-overlay-card"
                :class="{ 'is-guidance': tableState !== 'exercise' }"
              >
                <template v-if="tableState === 'setup'">
                  <h3>Choisis un verbe et un temps pour commencer.</h3>
                  <p>Utilise les deux menus en haut.</p>
                </template>
                <template v-else-if="tableState === 'unavailable'">
                  <h3>Ce temps n'est pas disponible pour ce verbe.</h3>
                  <p>Choisis un autre verbe ou un autre temps dans les menus.</p>
                </template>
                <template v-else>
                  <h3>Le tableau est masqué pendant l'exercice.</h3>
                  <p>L'afficher mettra fin à la série en cours.</p>
                  <button type="button" @click.stop="showTable">Afficher la conjugaison</button>
                </template>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section ref="exerciseSection" class="page-block french-hub__exercise-card">
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
            <template v-if="mode.key === 'flashcards'">
              <span class="french-hub__score-chip">6 cartes</span>
              <span class="french-hub__score-chip">Révision libre</span>
            </template>
            <template v-else-if="mode.key === 'qcm'">
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
          @summary-update="refreshScoreSummary"
        />
      </div>
    </section>
  </section>
</template>

<style scoped>
.french-hub {
  display: grid;
  gap: 10px;
}

.french-hub__header {
  display: grid;
  gap: 4px;
}

.french-hub__settings,
.french-hub__exercise-card,
.french-hub__controls,
.french-hub__workspace-grid {
  display: grid;
  gap: 8px;
}

.french-hub__settings {
  padding-top: 16px;
  padding-bottom: 16px;
}

.french-hub__exercise-card {
  padding-top: 16px;
}

.french-hub__settings-grid {
  display: grid;
  gap: 8px;
}

.french-hub__select-field {
  border-radius: 14px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.french-hub__select-field.is-guided {
  background: rgba(224, 255, 235, 0.9);
  box-shadow:
    0 0 0 3px rgba(47, 163, 107, 0.22),
    0 10px 20px rgba(47, 163, 107, 0.18);
  transform: translateY(-1px);
}

.french-hub__bands {
  display: grid;
  gap: 6px;
}

.french-hub__band {
  display: grid;
  gap: 1px;
  text-align: left;
  border: 1px solid rgba(140, 167, 193, 0.35);
  border-radius: 14px;
  padding: 7px 10px;
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
  font-size: 0.92rem;
}

.french-hub__band span {
  color: #4b647d;
  font-size: 0.82rem;
  line-height: 1.15;
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
  gap: 8px;
  margin: 0;
  background: rgba(255, 255, 255, 0.96);
  padding: 14px;
}

.french-hub__table-head {
  display: grid;
  gap: 6px;
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
  min-height: 30px;
  width: fit-content;
  padding: 0 10px;
  border-radius: 999px;
  background: #eaf8ef;
  border: 1px solid #b6d9bf;
  font-weight: 800;
  font-size: 0.92rem;
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
  min-height: 180px;
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
  padding: 12px;
  z-index: 2;
}

.french-hub__table-overlay-card {
  width: min(320px, 100%);
  display: grid;
  gap: 6px;
  padding: 14px;
  text-align: center;
  border-radius: 18px;
  border: 1px solid rgba(181, 198, 220, 0.7);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 26px rgba(36, 48, 65, 0.16);
}

.french-hub__table-overlay-card.is-guidance {
  border-style: dashed;
  background: rgba(252, 254, 255, 0.94);
  box-shadow: 0 10px 18px rgba(36, 48, 65, 0.1);
}

.french-hub__table-overlay-card h3,
.french-hub__table-overlay-card p {
  margin: 0;
}

.french-hub__table-overlay-card p {
  color: #4b647d;
  line-height: 1.35;
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
  gap: 8px;
}

.french-hub__mode-card {
  width: 100%;
  border: 1px solid rgba(200, 214, 232, 0.95);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 12px 24px rgba(32, 49, 74, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.french-hub__mode-card:hover:not(.is-disabled),
.french-hub__mode-card:focus-visible:not(.is-disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 16px 28px rgba(32, 49, 74, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.french-hub__mode-card.is-active {
  border-color: rgba(87, 153, 255, 0.45);
  box-shadow:
    0 16px 28px rgba(42, 76, 122, 0.12),
    0 0 0 3px rgba(87, 153, 255, 0.14);
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
  margin-top: 0;
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
  padding: 0;
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
  .french-hub__header {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: baseline;
    gap: 14px;
  }

  .french-hub__header .hub-intro {
    margin: 0;
    text-align: left;
  }

  .french-hub__workspace-grid {
    grid-template-columns: 1fr 1.12fr;
    align-items: start;
  }

  .french-hub__modes {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

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
}

@media (max-width: 767px) {
  .french-hub__panel.is-mode-flashcards {
    margin-inline: -17px;
  }
}
</style>
