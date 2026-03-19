<script setup>
import { computed } from 'vue';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import StudyFlashcardCarousel from '@/components/StudyFlashcardCarousel.vue';
import { buildFrenchVerbCards, getFrenchVerb } from '@/features/languages/frenchConjugations';

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
const cards = computed(() =>
  buildFrenchVerbCards(props.verbKey, props.tenseKey, props.source, props.moodKey).map((card) => ({
    id: card.id,
    front: card.prompt,
    back: card.answer,
  }))
);
</script>

<template>
  <StudyFlashcardCarousel
    v-if="verb && cards.length"
    :cards="cards"
    hint="Cliquer pour révéler la conjugaison"
    shuffle-label="🔀 Mélanger les cartes"
  />

  <QuizEmptyState v-else message="Verbe introuvable." />
</template>
