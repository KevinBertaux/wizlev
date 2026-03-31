<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import QuizSelectField from '@/components/QuizSelectField.vue';
import StudyFlashcardCarousel from '@/components/StudyFlashcardCarousel.vue';
import { getEnglishList, hydrateRemoteEnglishLists, listEnglishOptions } from '@/features/languages/englishLists';

const cardDirectionStorageKey = 'wizlev_english_card_direction';
const ttsSupported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window;

const ttsPlaybackRates = [0.9, 0.6];

const selectedList = ref('');
const words = ref([]);
const flashcardState = ref({
  currentCard: null,
  currentIndex: 0,
  totalCards: 0,
  isFlipped: false,
});

const cardDirection = ref('en-first');
const ttsNextRateIndex = ref(0);
const ttsVoices = ref([]);
const isSpeaking = ref(false);
const ttsStatus = ref('');

let currentUtterance = null;
let voicesChangedHandler = null;
const isRemoteSyncPending = ref(false);
const hasPendingListInteraction = ref(false);

const availableEnglishOptions = ref(listEnglishOptions());
const activeList = computed(() => (selectedList.value ? getEnglishList(selectedList.value) : null));
const englishListOptionsWithCount = computed(() =>
  availableEnglishOptions.value.map((list) => {
    const currentList = getEnglishList(list.key);
    return {
      ...list,
      wordCount: Array.isArray(currentList?.words) ? currentList.words.length : list.wordCount || 0,
    };
  })
);
const listSelectOptions = computed(() =>
  englishListOptionsWithCount.value.map((list) => ({
    value: list.key,
    label: `${list.label} (${list.wordCount} mots)`,
  }))
);
const listSelectLabel = computed(() => {
  const count = availableEnglishOptions.value.length;
  const suffix = count === 1 ? '' : 's';
  return `Choisir une liste : ${count} liste${suffix}`;
});

const isFrenchFirst = computed(() => cardDirection.value === 'fr-first');
const flashcards = computed(() =>
  words.value.map((word, index) => ({
    id: `${selectedList.value || 'english'}-${index}-${word.english}-${word.french}`,
    english: word.english,
    french: word.french,
    front: isFrenchFirst.value ? word.french : word.english,
    back: isFrenchFirst.value ? word.english : word.french,
  }))
);
const currentWord = computed(() => {
  const card = flashcardState.value.currentCard;
  if (!card) {
    return null;
  }
  return {
    english: card.english,
    french: card.french,
  };
});
const canPlayTts = computed(
  () => ttsSupported && !!currentWord.value && (!isFrenchFirst.value || flashcardState.value.isFlipped)
);
const showRemoteSyncHint = computed(
  () => isRemoteSyncPending.value && hasPendingListInteraction.value
);

function cloneWords(sourceWords) {
  return sourceWords.map((word) => ({ ...word }));
}

function loadList(listKey) {
  if (!listKey) {
    stopSpeech();
    words.value = [];
    ttsNextRateIndex.value = 0;
    return;
  }

  const list = getEnglishList(listKey);
  if (!list || !Array.isArray(list.words)) {
    words.value = [];
    ttsNextRateIndex.value = 0;
    return;
  }

  stopSpeech();
  words.value = cloneWords(list.words);
  ttsNextRateIndex.value = 0;
}

function markListInteraction() {
  if (isRemoteSyncPending.value) {
    hasPendingListInteraction.value = true;
  }
}

function refreshVoices() {
  if (!ttsSupported) {
    ttsVoices.value = [];
    return;
  }
  ttsVoices.value = speechSynthesis.getVoices();
}

function findBestVoice() {
  if (!ttsVoices.value.length) {
    return null;
  }

  const wanted = 'en-us';
  let voice = ttsVoices.value.find((item) => item.lang && item.lang.toLowerCase() === wanted);
  if (voice) {
    return voice;
  }

  voice = ttsVoices.value.find(
    (item) => item.lang && item.lang.toLowerCase().startsWith(wanted)
  );
  if (voice) {
    return voice;
  }

  return ttsVoices.value.find(
    (item) => item.lang && item.lang.toLowerCase().startsWith('en-')
  );
}

function stopSpeech() {
  if (!ttsSupported) {
    return;
  }
  speechSynthesis.cancel();
  isSpeaking.value = false;
  currentUtterance = null;
  ttsStatus.value = '';
}

function toggleSpeakWord() {
  if (!canPlayTts.value || !currentWord.value) {
    return;
  }

  if (isSpeaking.value) {
    stopSpeech();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(currentWord.value.english);
  utterance.lang = 'en-US';
  const currentRate = ttsPlaybackRates[ttsNextRateIndex.value] || 1;
  utterance.rate = currentRate;

  const preferredVoice = findBestVoice();
  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang;
  }

  utterance.onstart = () => {
    isSpeaking.value = true;
    ttsStatus.value = '';
  };

  utterance.onend = () => {
    isSpeaking.value = false;
    currentUtterance = null;
    ttsStatus.value = '';
  };

  utterance.onerror = (event) => {
    isSpeaking.value = false;
    currentUtterance = null;

    if (event && (event.error === 'canceled' || event.error === 'interrupted')) {
      ttsStatus.value = '';
      return;
    }

    ttsStatus.value = 'Lecture impossible';
  };

  currentUtterance = utterance;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
  ttsNextRateIndex.value = (ttsNextRateIndex.value + 1) % ttsPlaybackRates.length;
}

function handleFlashcardStateChange(state) {
  flashcardState.value = state;
  stopSpeech();
  ttsNextRateIndex.value = 0;
}

watch(selectedList, (newList) => {
  loadList(newList);
});

watch(cardDirection, (direction) => {
  if (direction !== 'en-first' && direction !== 'fr-first') {
    return;
  }
  stopSpeech();
  ttsNextRateIndex.value = 0;
  if (typeof window !== 'undefined') {
    localStorage.setItem(cardDirectionStorageKey, direction);
  }
});

onMounted(async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wizlev_tts_accent');

    const savedDirection = localStorage.getItem(cardDirectionStorageKey);
    if (savedDirection === 'en-first' || savedDirection === 'fr-first') {
      cardDirection.value = savedDirection;
    }
  }

  availableEnglishOptions.value = listEnglishOptions();
  loadList(selectedList.value);

  isRemoteSyncPending.value = true;
  hydrateRemoteEnglishLists()
    .then(() => {
      availableEnglishOptions.value = listEnglishOptions();
      loadList(selectedList.value);
    })
    .finally(() => {
      isRemoteSyncPending.value = false;
    });

  if (!ttsSupported) {
    return;
  }

  refreshVoices();
  voicesChangedHandler = () => refreshVoices();
  if (typeof speechSynthesis.addEventListener === 'function') {
    speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
  } else {
    speechSynthesis.onvoiceschanged = voicesChangedHandler;
  }
});

onUnmounted(() => {
  stopSpeech();

  if (!ttsSupported || !voicesChangedHandler) {
    return;
  }

  if (typeof speechSynthesis.removeEventListener === 'function') {
    speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
  } else if (speechSynthesis.onvoiceschanged === voicesChangedHandler) {
    speechSynthesis.onvoiceschanged = null;
  }
});
</script>

<template>
  <section class="page-block quiz-module">
    <h1>Vocabulaire anglais</h1>

    <div class="settings-box">
      <div class="mb-3">
        <QuizSelectField
          v-model="selectedList"
          select-id="englishListSelect"
          :label="listSelectLabel"
          placeholder="-- Choisir une liste --"
          :placeholder-disabled="true"
          :options="listSelectOptions"
          @pointerdown.capture="markListInteraction"
          @focusin="markListInteraction"
          @keydown.capture="markListInteraction"
        />
        <div v-if="showRemoteSyncHint" class="background-sync-hint" role="status" aria-live="polite">
          <span class="background-sync-hint__spinner" aria-hidden="true" />
          <span>Les listes se mettent encore à jour en arriere-plan…</span>
        </div>
      </div>

      <div class="grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(180px,_1fr)]">
        <div class="setting-field setting-direction">
          <label for="cardDirectionSelect">Sens :</label>
          <select id="cardDirectionSelect" v-model="cardDirection">
            <option value="en-first">Anglais -> Français</option>
            <option value="fr-first">Français -> Anglais</option>
          </select>
        </div>
      </div>
    </div>

    <p v-if="activeList?.description" class="list-description">{{ activeList.description }}</p>

    <template v-if="selectedList">
      <StudyFlashcardCarousel
        :cards="flashcards"
        hint="Cliquer pour révéler la traduction"
        shuffle-label="🔀 Mélanger"
        @state-change="handleFlashcardStateChange"
      >
        <template v-if="ttsSupported" #aside-control>
          <button
            class="tts-inline-btn"
            :class="{ 'is-speaking': isSpeaking }"
            type="button"
            :disabled="!canPlayTts"
            :aria-disabled="!canPlayTts"
            :aria-label="isSpeaking ? 'Arrêter la lecture' : 'Écouter le mot'"
            @click.stop="toggleSpeakWord"
          >
            <span class="tts-icon" aria-hidden="true">🔊</span>
          </button>
        </template>
      </StudyFlashcardCarousel>

      <div v-if="ttsStatus" class="tts-status" aria-live="polite">{{ ttsStatus }}</div>
    </template>

    <QuizEmptyState v-else message="Choisir une liste pour commencer." />
  </section>
</template>

<style scoped>
.settings-box {
  background: rgba(255, 230, 109, 0.2);
}

.list-description {
  margin: 0 0 14px;
  text-align: center;
  color: #1f3550;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.14), rgba(111, 231, 221, 0.22));
  border: 1px solid rgba(78, 205, 196, 0.45);
  border-radius: 12px;
  padding: 12px 14px;
}

.background-sync-hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(53, 109, 188, 0.09);
  color: #264767;
  font-size: 0.92rem;
  font-weight: 600;
}

.background-sync-hint__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(53, 109, 188, 0.18);
  border-top-color: #356dbc;
  border-radius: 999px;
  animation: english-background-sync-spin 0.8s linear infinite;
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

.carousel-rail:active {
  background: rgba(50, 85, 116, 0.3);
}

.flashcard-count {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 800;
  font-size: 1.02rem;
  color: #25374d;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 2px rgba(247, 249, 252, 0.65);
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
}

.flashcard.flipped .flashcard-content {
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

.tts-inline-control {
  position: absolute;
  top: 50%;
  right: calc(var(--rail-width) + 10px);
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.tts-inline-btn {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 2px solid rgba(36, 48, 65, 0.26);
  background: #fbfdff;
  color: #243041;
  font-size: 1.15em;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.12);
  transition:
    transform 0.12s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.tts-icon {
  position: relative;
  z-index: 2;
}

.tts-inline-btn.is-speaking {
  border-color: #2e64d2;
  background: #e9f1ff;
  box-shadow:
    0 8px 16px rgba(15, 23, 42, 0.18),
    0 0 0 4px rgba(46, 100, 210, 0.22);
  animation: tts-speaking-pulse 0.9s ease-in-out infinite alternate;
}

.tts-inline-btn.is-speaking::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(46, 100, 210, 0.36);
  animation: tts-speaking-ring 1.1s ease-out infinite;
}

.tts-inline-btn:hover,
.tts-inline-btn:focus-visible {
  transform: translateY(-2px);
  border-color: #2f4e6f;
  background: #f2f7ff;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
}

.tts-inline-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.14);
}

.tts-inline-btn:disabled {
  cursor: not-allowed;
  opacity: 0.42;
  transform: none;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.08);
}

.tts-inline-btn:disabled:hover,
.tts-inline-btn:disabled:focus-visible,
.tts-inline-btn:disabled:active {
  transform: none;
  border-color: rgba(36, 48, 65, 0.26);
  background: #fbfdff;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.08);
}

:deep(.flashcard.flipped) .tts-inline-btn {
  border-color: rgba(15, 95, 90, 0.35);
  color: #0f5f5a;
}

:deep(.flashcard.flipped) .tts-inline-btn.is-speaking {
  border-color: #0f5f5a;
  box-shadow:
    0 8px 16px rgba(15, 23, 42, 0.16),
    0 0 0 4px rgba(15, 95, 90, 0.2);
}

.tts-status {
  min-height: 1.2em;
  text-align: center;
  margin-top: 10px;
  font-weight: 700;
  color: #5d6c80;
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

@keyframes tts-speaking-pulse {
  0% {
    transform: translateY(-2px) scale(1);
  }
  100% {
    transform: translateY(-2px) scale(1.04);
  }
}

@keyframes english-background-sync-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes tts-speaking-ring {
  0% {
    opacity: 0.6;
    transform: scale(0.95);
  }
  100% {
    opacity: 0;
    transform: scale(1.18);
  }
}

@media (max-width: 1023px) and (min-width: 768px) {
  .flashcard {
    --rail-width: 30px;
  }

  .carousel-rail {
    background: rgba(50, 85, 116, 0.16);
  }

  .carousel-rail:hover,
  .carousel-rail:focus-visible {
    background: rgba(50, 85, 116, 0.3);
  }
}

@media (max-width: 767px) {
  .flashcard {
    --rail-width: 28px;
    min-height: 230px;
    padding: 58px calc(var(--rail-width) + 12px) 20px;
  }

  .flashcard-word,
  .flashcard-translation {
    font-size: clamp(1.6em, 7.5vw, 2em);
  }

  .flashcard-hint {
    font-size: clamp(0.74rem, 2.5vw, 0.84rem);
  }

  .flashcard-count {
    top: 14px;
  }

  .tts-inline-control {
    top: 10px;
    right: calc(var(--rail-width) + 6px);
    transform: none;
  }

  .tts-inline-btn {
    width: 44px;
    height: 44px;
    font-size: 1.05rem;
    border-width: 2px;
  }

}

@media (prefers-reduced-motion: reduce) {
  .card-shared-next-enter-active,
  .card-shared-next-leave-active,
  .card-shared-prev-enter-active,
  .card-shared-prev-leave-active {
    transition: none !important;
  }

  .card-shared-next-enter-from,
  .card-shared-next-leave-to,
  .card-shared-prev-enter-from,
  .card-shared-prev-leave-to {
    opacity: 1 !important;
    transform: none !important;
  }

  .tts-inline-btn.is-speaking,
  .tts-inline-btn.is-speaking::after {
    animation: none !important;
  }
}
</style>

