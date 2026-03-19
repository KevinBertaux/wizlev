<script setup>
import { computed } from 'vue';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import { buildFrenchVerbRows, getFrenchVerb } from '@/features/languages/frenchConjugations';

const props = defineProps({
  verbKey: {
    type: String,
    required: true,
  },
  moodKey: {
    type: String,
    default: 'indicatif',
  },
  tenseKey: {
    type: String,
    default: 'present',
  },
  source: {
    type: Object,
    default: undefined,
  },
});

const verb = computed(() => getFrenchVerb(props.verbKey, props.source, props.moodKey, props.tenseKey));
const rows = computed(() =>
  buildFrenchVerbRows(props.verbKey, props.tenseKey, props.source, props.moodKey)
);
</script>

<template>
  <section class="french-table-card">
    <div v-if="verb" class="conjugation-table" role="table" aria-label="Tableau de conjugaison">
      <div v-for="row in rows" :key="row.key" class="conjugation-row" role="row">
        <div class="conjugation-label" role="rowheader">{{ row.label }}</div>
        <div class="conjugation-values" role="cell">{{ row.forms.join(' • ') }}</div>
      </div>
    </div>

    <QuizEmptyState v-else message="Verbe introuvable." />
  </section>
</template>

<style scoped>
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

@media (min-width: 980px) {
  .conjugation-row {
    grid-template-columns: 180px minmax(0, 1fr);
    align-items: center;
  }
}
</style>
