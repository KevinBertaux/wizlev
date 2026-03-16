<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import { buildFrenchVerbRows, getFrenchVerb } from '@/features/languages/frenchConjugations';

const route = useRoute();
const router = useRouter();

const verbKey = computed(() => {
  const value = route.params.verbKey;
  return typeof value === 'string' ? value : '';
});

const verb = computed(() => getFrenchVerb(verbKey.value));
const rows = computed(() => buildFrenchVerbRows(verbKey.value));

function goBack() {
  router.push({ name: 'languages-french' });
}

function openQcm() {
  if (!verb.value) {
    return;
  }

  router.push({
    name: 'languages-french-qcm',
    params: { verbKey: verb.value.key },
  });
}

function openInput() {
  if (!verb.value) {
    return;
  }

  router.push({
    name: 'languages-french-input',
    params: { verbKey: verb.value.key },
  });
}

function openFlashcards() {
  if (!verb.value) {
    return;
  }

  router.push({
    name: 'languages-french-flashcards',
    params: { verbKey: verb.value.key },
  });
}
</script>

<template>
  <section class="page-block french-table-view">
    <div class="french-table-view__header">
      <button class="mp-btn mp-btn-secondary" type="button" @click="goBack">← Retour au hub</button>
      <div>
        <h1>Tableau du présent</h1>
        <p v-if="verb" class="french-table-view__subtitle">
          Verbe : <strong>{{ verb.label }}</strong>
        </p>
      </div>
    </div>

    <section v-if="verb" class="page-block french-table-card">
      <div class="conjugation-table" role="table" aria-label="Tableau de conjugaison du présent">
        <div v-for="row in rows" :key="row.key" class="conjugation-row" role="row">
          <div class="conjugation-label" role="rowheader">{{ row.label }}</div>
          <div class="conjugation-values" role="cell">{{ row.values.join(' • ') }}</div>
        </div>
      </div>

      <div class="french-table-view__actions">
        <button class="mp-btn mp-btn-secondary" type="button" @click="openFlashcards">Passer aux flashcards →</button>
        <button class="mp-btn mp-btn-primary" type="button" @click="openQcm">Passer au QCM →</button>
        <button class="mp-btn mp-btn-secondary" type="button" @click="openInput">Passer à la saisie →</button>
      </div>
    </section>

    <QuizEmptyState v-else message="Verbe introuvable." />
  </section>
</template>

<style scoped>
.french-table-view {
  display: grid;
  gap: 18px;
}

.french-table-view__header {
  display: grid;
  gap: 14px;
}

.french-table-view__header h1 {
  margin: 0;
}

.french-table-view__subtitle {
  margin: 4px 0 0;
  color: #2b4461;
  font-weight: 700;
}

.french-table-card {
  background: rgba(255, 255, 255, 0.94);
}

.conjugation-table {
  display: grid;
  gap: 10px;
}

.french-table-view__actions {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 12px;
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
