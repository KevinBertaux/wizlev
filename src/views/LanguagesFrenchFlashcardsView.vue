<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import StudyFlashcardCarousel from '@/components/StudyFlashcardCarousel.vue';
import { buildFrenchVerbCards, getFrenchVerb } from '@/features/languages/frenchConjugations';

const route = useRoute();
const router = useRouter();

const verbKey = computed(() => {
  const value = route.params.verbKey;
  return typeof value === 'string' ? value : '';
});

const verb = computed(() => getFrenchVerb(verbKey.value));
const cards = computed(() =>
  buildFrenchVerbCards(verbKey.value).map((card) => ({
    id: card.id,
    front: card.prompt,
    back: card.answer,
  }))
);

function goBack() {
  router.push({
    name: 'languages-french',
    query: {
      ...route.query,
      verb: verbKey.value || route.query.verb,
      mode: 'flashcards',
    },
  });
}
</script>

<template>
  <section class="page-block french-flashcards-view">
    <div class="french-flashcards-view__header">
      <button class="mp-btn mp-btn-secondary" type="button" @click="goBack">← Retour au hub</button>
      <div>
        <h1>🇫🇷 Français - Flashcards</h1>
        <p v-if="verb" class="french-flashcards-view__subtitle">
          Mémorise <strong>{{ verb.label }}</strong> pronom par pronom.
        </p>
      </div>
    </div>

    <StudyFlashcardCarousel
      v-if="verb && cards.length"
      :cards="cards"
      hint="Cliquer pour révéler la conjugaison"
      shuffle-label="🔀 Mélanger les cartes"
    />

    <QuizEmptyState v-else message="Verbe introuvable." />
  </section>
</template>

<style scoped>
.french-flashcards-view {
  display: grid;
  gap: 18px;
}

.french-flashcards-view__header {
  display: grid;
  gap: 14px;
}

.french-flashcards-view__header h1 {
  margin: 0;
}

.french-flashcards-view__subtitle {
  margin: 4px 0 0;
  color: #2b4461;
  font-weight: 700;
}
</style>
