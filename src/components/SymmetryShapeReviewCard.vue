<script setup>
import { computed, ref } from 'vue';
import SymmetryShapePreview from '@/components/SymmetryShapePreview.vue';
import { SYMMETRY_REVIEW_STATUS } from '@/features/math/symmetryReviewSessionStore';

const props = defineProps({
  entry: {
    type: Object,
    required: true,
  },
  gridSize: {
    type: Number,
    required: true,
  },
});
const emit = defineEmits(['set-review-status', 'toggle-deleted']);

const previewAxis = ref('vertical');

const statusLabels = Object.freeze({
  accepted: 'Acceptée',
  review: 'À revoir',
  rejected: 'Rejetée',
});
const reviewStatusLabels = Object.freeze({
  [SYMMETRY_REVIEW_STATUS.PENDING]: 'En attente de tri',
  [SYMMETRY_REVIEW_STATUS.ACCEPTED]: 'Acceptée',
  [SYMMETRY_REVIEW_STATUS.REVIEW]: 'À revoir',
  [SYMMETRY_REVIEW_STATUS.REJECTED]: 'Rejetée',
});
const reviewDecisionButtons = Object.freeze([
  { id: SYMMETRY_REVIEW_STATUS.ACCEPTED, label: 'Accepter' },
  { id: SYMMETRY_REVIEW_STATUS.REJECTED, label: 'Rejeter' },
]);
const issueLabels = Object.freeze({
  moins_de_3_points: 'Moins de 3 points',
  point_invalide: 'Point invalide',
  hors_grille: 'Point hors grille',
  points_dupliques: 'Points dupliqués',
  tous_alignes: 'Tous les points sont alignés',
  forme_trop_petite: 'Forme trop petite',
  trop_de_points_sur_axe: 'Trop de points sur l’axe',
  doublon_exact: 'Doublon exact',
  doublon_normalise: 'Doublon après normalisation',
  axe_charge: 'Axe trop chargé',
  silhouette_peu_variee: 'Silhouette peu variée',
  peu_de_changements_de_direction: 'Peu de changements de direction',
  bon_potentiel_pedagogique: 'Bon potentiel pédagogique',
  forme_correcte: 'Forme correcte',
});

function labelForIssue(code) {
  return issueLabels[code] || code;
}

const cardTone = computed(() => {
  if (props.entry.deleted) {
    return 'deleted';
  }
  if (props.entry.reviewStatus && props.entry.reviewStatus !== SYMMETRY_REVIEW_STATUS.PENDING) {
    return props.entry.reviewStatus;
  }
  return props.entry.autoStatus;
});
const autoStatusLabel = computed(
  () => reviewStatusLabels[props.entry.autoStatus] || reviewStatusLabels[SYMMETRY_REVIEW_STATUS.PENDING]
);
const issueCount = computed(() => props.entry.hardFailures.length + props.entry.warnings.length);
const hardFailureLabels = computed(() => props.entry.hardFailures.map(labelForIssue));
const warningLabels = computed(() => props.entry.warnings.map(labelForIssue));
const noteLabels = computed(() => props.entry.notes.map(labelForIssue));
const truncatedWarnings = computed(() => warningLabels.value.slice(0, 2));
const hiddenWarningsCount = computed(() => Math.max(0, warningLabels.value.length - truncatedWarnings.value.length));
const hardFailureCount = computed(() => hardFailureLabels.value.length);
const warningCount = computed(() => warningLabels.value.length);

function pluralize(count, singular, plural = `${singular}s`) {
  return count > 1 ? plural : singular;
}

const reviewSummary = computed(() => {
  const parts = [];

  if (hardFailureCount.value > 0) {
    parts.push(`${hardFailureCount.value} ${pluralize(hardFailureCount.value, 'blocage')}`);
  }

  if (warningCount.value > 0) {
    parts.push(`${warningCount.value} ${pluralize(warningCount.value, "point d'attention", "points d'attention")}`);
  }

  if (parts.length === 0) {
    return 'Aucun signal détecté';
  }

  return parts.join(' · ');
});
</script>

<template>
  <article class="sym-review-card" :class="[`is-${cardTone}`, { 'is-deleted': entry.deleted }]">
    <header class="sym-review-card__head">
      <div class="sym-review-card__identity">
        <p class="sym-review-card__id">{{ entry.id }}</p>
        <p class="sym-review-card__meta">{{ entry.pointCount }} points · score {{ entry.score }}/100</p>
      </div>
    </header>

    <p class="sym-review-card__auto-status">Pré-tri : {{ autoStatusLabel }}</p>

    <div class="axis-toggle" role="group" aria-label="Choix de l’axe d’aperçu">
      <button
        class="axis-toggle__btn"
        :class="{ 'is-active': previewAxis === 'vertical' }"
        :aria-pressed="previewAxis === 'vertical' ? 'true' : 'false'"
        type="button"
        title="Aperçu vertical"
        @click="previewAxis = 'vertical'"
      >
        Vertical
      </button>
      <button
        class="axis-toggle__btn"
        :class="{ 'is-active': previewAxis === 'horizontal' }"
        :aria-pressed="previewAxis === 'horizontal' ? 'true' : 'false'"
        type="button"
        title="Aperçu horizontal"
        @click="previewAxis = 'horizontal'"
      >
        Horizontal
      </button>
    </div>

    <div class="sym-review-card__preview-frame">
      <SymmetryShapePreview
        :points="entry.points"
        :grid-size="gridSize"
        :axis="previewAxis"
        :axis-overflow="6"
        :size="120"
        :padding="12"
        :point-radius="3.2"
        :stroke-width="2.4"
        :filled="true"
        :transform-for-axis="true"
        class="sym-review-card__preview"
      />
    </div>

    <div class="sym-review-card__summary">
      <p class="sym-review-card__summary-main">{{ reviewSummary }}</p>
      <p v-if="noteLabels.length" class="sym-review-card__summary-note">{{ noteLabels[0] }}</p>
    </div>

    <div class="sym-review-card__decision-block">
      <p class="sym-review-card__decision-label">Décision</p>
      <div class="sym-review-card__decision-grid">
        <button
          v-for="option in reviewDecisionButtons"
          :key="option.id"
          class="sym-review-card__decision-btn"
          :class="{ 'is-active': entry.reviewStatus === option.id }"
          :aria-pressed="entry.reviewStatus === option.id ? 'true' : 'false'"
          type="button"
          @click="emit('set-review-status', option.id)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <button
      class="sym-review-card__delete-btn"
      :class="{ 'is-deleted': entry.deleted }"
      type="button"
      @click="emit('toggle-deleted')"
    >
      <span aria-hidden="true">🗑️</span>
      <span>{{ entry.deleted ? "Restaurer dans l'export" : "Supprimer de l'export" }}</span>
    </button>

    <div class="sym-review-card__issues-stack">
      <div v-if="hardFailureLabels.length" class="sym-review-card__issues is-hard">
        <p class="sym-review-card__issues-title">Blocages</p>
        <ul>
          <li v-for="failure in hardFailureLabels" :key="failure">{{ failure }}</li>
        </ul>
      </div>

      <div v-if="truncatedWarnings.length" class="sym-review-card__issues is-warning">
        <p class="sym-review-card__issues-title">Points d'attention</p>
        <ul>
          <li v-for="warning in truncatedWarnings" :key="warning">{{ warning }}</li>
          <li v-if="hiddenWarningsCount > 0">+ {{ hiddenWarningsCount }} autre(s)</li>
        </ul>
      </div>
    </div>
  </article>
</template>

<style scoped>
.axis-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  height: 40px;
  gap: 4px;
  padding: 4px;
  border: 1px solid #cfdae6;
  border-radius: 10px;
  background: linear-gradient(180deg, #f7fafc 0%, #eef4fa 100%);
}

.axis-toggle__btn {
  min-width: 0;
  height: 100%;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #35516e;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.axis-toggle__btn:hover,
.axis-toggle__btn:focus-visible {
  background: #e8f1fb;
  border-color: #a8c4dd;
  color: #123b5f;
  outline: none;
}

.axis-toggle__btn.is-active {
  background: #dcecff;
  border-color: #67a5d6;
  color: #123b5f;
  box-shadow: inset 0 0 0 2px rgba(18, 59, 95, 0.12);
}

.sym-review-card__auto-status,
.sym-review-card__decision-label {
  margin: 0;
  color: #4e657c;
  font-size: 0.79rem;
  font-weight: 700;
}

.sym-review-card__decision-block {
  display: grid;
  gap: 6px;
}

.sym-review-card__decision-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.sym-review-card__decision-btn,
.sym-review-card__delete-btn {
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid #cad8e5;
  border-radius: 10px;
  background: #ffffff;
  color: #23415c;
  font-size: 0.79rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.sym-review-card__decision-btn:hover,
.sym-review-card__decision-btn:focus-visible,
.sym-review-card__delete-btn:hover,
.sym-review-card__delete-btn:focus-visible {
  background: #eef5fc;
  border-color: #86adcf;
  color: #143754;
  outline: none;
}

.sym-review-card__decision-btn.is-active {
  background: #dcecff;
  border-color: #67a5d6;
  color: #123b5f;
  box-shadow: inset 0 0 0 2px rgba(18, 59, 95, 0.12);
}

.sym-review-card__delete-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-color: #d8a2a2;
  background: #fff2f2;
  color: #8f2f2f;
}

.sym-review-card__delete-btn.is-deleted {
  border-color: #c2cdda;
  background: #eef3f8;
  color: #40566b;
}

</style>
