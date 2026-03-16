<script setup>
import { computed, ref, watch } from 'vue';
import { shuffleList } from '@/features/common/questionBag';

const props = defineProps({
  cards: {
    type: Array,
    default: () => [],
  },
  hint: {
    type: String,
    default: 'Cliquer pour révéler la réponse',
  },
  shuffleLabel: {
    type: String,
    default: '🔀 Mélanger',
  },
});

const currentIndex = ref(0);
const isFlipped = ref(false);
const transitionName = ref('card-shared-next');
const orderedCards = ref([]);

const totalCards = computed(() => orderedCards.value.length);
const currentCard = computed(() => orderedCards.value[currentIndex.value] || null);
const cardNumber = computed(() => (totalCards.value ? currentIndex.value + 1 : 0));

function resetCards(cards) {
  orderedCards.value = Array.isArray(cards) ? [...cards] : [];
  currentIndex.value = 0;
  isFlipped.value = false;
}

function previousCard() {
  if (totalCards.value <= 1) {
    return;
  }

  transitionName.value = 'card-shared-prev';
  currentIndex.value = (currentIndex.value - 1 + totalCards.value) % totalCards.value;
  isFlipped.value = false;
}

function nextCard() {
  if (totalCards.value <= 1) {
    return;
  }

  transitionName.value = 'card-shared-next';
  currentIndex.value = (currentIndex.value + 1) % totalCards.value;
  isFlipped.value = false;
}

function flipCard() {
  if (!currentCard.value) {
    return;
  }
  isFlipped.value = !isFlipped.value;
}

function shuffleCards() {
  if (totalCards.value <= 1) {
    return;
  }

  orderedCards.value = shuffleList(orderedCards.value);
  currentIndex.value = 0;
  isFlipped.value = false;
}

watch(
  () => props.cards,
  (cards) => {
    resetCards(cards);
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="currentCard" class="study-flashcards">
    <div class="flashcard-carousel">
      <Transition :name="transitionName" mode="out-in">
        <div :key="currentCard.id || cardNumber" class="flashcard" :class="{ flipped: isFlipped }" @click="flipCard">
          <button class="carousel-rail carousel-rail-left" type="button" aria-label="Carte précédente" @click.stop="previousCard">
            <span aria-hidden="true">❮</span>
          </button>

          <button class="carousel-rail carousel-rail-right" type="button" aria-label="Carte suivante" @click.stop="nextCard">
            <span aria-hidden="true">❯</span>
          </button>

          <div class="flashcard-count">{{ cardNumber }}/{{ totalCards }}</div>

          <div class="flashcard-content">
            <div class="flashcard-word">{{ currentCard.front }}</div>
            <div v-if="isFlipped" class="flashcard-translation">{{ currentCard.back }}</div>
          </div>

          <div v-if="!isFlipped" class="flashcard-hint">{{ hint }}</div>
        </div>
      </Transition>
    </div>

    <div class="study-flashcards__actions">
      <button class="mp-btn mp-btn-secondary" type="button" @click="shuffleCards">{{ shuffleLabel }}</button>
    </div>
  </div>
</template>

<style scoped>
.study-flashcards {
  display: grid;
  gap: 12px;
}

.flashcard-carousel {
  display: block;
  max-width: 720px;
  margin-inline: auto;
}

.flashcard {
  --rail-width: 32px;
  position: relative;
  background: #fbfdff;
  border-radius: 18px;
  min-height: 260px;
  padding: 42px calc(var(--rail-width) + 28px);
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(36, 48, 65, 0.13);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.carousel-rail {
  position: absolute;
  top: 0;
  bottom: 0;
  width: var(--rail-width);
  border: 0;
  margin: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #325574;
  background: rgba(50, 85, 116, 0.1);
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.carousel-rail-left {
  left: 0;
  border-right: 1px solid rgba(50, 85, 116, 0.16);
}

.carousel-rail-right {
  right: 0;
  border-left: 1px solid rgba(50, 85, 116, 0.16);
}

.carousel-rail span {
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
}

.carousel-rail:hover,
.carousel-rail:focus-visible {
  background: rgba(50, 85, 116, 0.24);
  color: #1b3d5c;
  box-shadow: inset 0 0 0 2px rgba(50, 85, 116, 0.26);
}

.flashcard-count {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 800;
  font-size: 1.02rem;
  color: #25374d;
}

.flashcard.flipped {
  background: linear-gradient(135deg, #4ecdc4, #6fe7dd);
  color: #113246;
}

.flashcard-content {
  width: 100%;
  min-height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 14px;
}

.flashcard-word,
.flashcard-translation {
  font-size: 2.15em;
  line-height: 1.15;
  margin: 0;
  text-align: center;
}

.flashcard-word {
  font-weight: 700;
}

.flashcard-translation {
  font-weight: 600;
}

.flashcard-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - ((var(--rail-width) + 14px) * 2));
  max-width: 100%;
  text-align: center;
  font-size: 0.9em;
  opacity: 0.72;
}

.study-flashcards__actions {
  display: flex;
  justify-content: center;
}

.card-shared-next-enter-active,
.card-shared-next-leave-active,
.card-shared-prev-enter-active,
.card-shared-prev-leave-active {
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}

.card-shared-next-enter-from {
  opacity: 0;
  transform: translateX(22px);
}

.card-shared-next-leave-to {
  opacity: 0;
  transform: translateX(-22px);
}

.card-shared-prev-enter-from {
  opacity: 0;
  transform: translateX(-22px);
}

.card-shared-prev-leave-to {
  opacity: 0;
  transform: translateX(22px);
}

@media (max-width: 767px) {
  .flashcard {
    --rail-width: 28px;
    min-height: 230px;
    padding: 50px calc(var(--rail-width) + 12px) 20px;
  }

  .flashcard-word,
  .flashcard-translation {
    font-size: clamp(1.6em, 7.5vw, 2em);
  }

  .flashcard-hint {
    font-size: clamp(0.74rem, 2.5vw, 0.84rem);
  }
}
</style>
