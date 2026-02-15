<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { getVocabList, vocabListOptions } from '@/features/vocab/vocabLists';

const ttsStorageKey = 'manabuplay_tts_accent';
const legacyTtsStorageKey = 'revision_enfants_tts_accent';
const ttsSupported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window;

const selectedList = ref('fruits');
const words = ref([]);
const currentIndex = ref(0);
const isFlipped = ref(false);

const ttsAccent = ref('en-US');
const ttsVoices = ref([]);
const isSpeaking = ref(false);
const ttsStatus = ref('');

let currentUtterance = null;
let voicesChangedHandler = null;

const touchStartX = ref(0);
const touchStartY = ref(0);
const suppressNextFlip = ref(false);

const currentWord = computed(() => words.value[currentIndex.value] || null);
const cardNumber = computed(() => (words.value.length ? currentIndex.value + 1 : 0));
const totalCards = computed(() => words.value.length);

function cloneWords(sourceWords) {
  return sourceWords.map((word) => ({ ...word }));
}

function loadList(listKey) {
  const list = getVocabList(listKey);
  if (!list || !Array.isArray(list.words)) {
    words.value = [];
    currentIndex.value = 0;
    isFlipped.value = false;
    return;
  }

  stopSpeech();
  words.value = cloneWords(list.words);
  currentIndex.value = 0;
  isFlipped.value = false;
}

function showCard(index) {
  if (!words.value.length) {
    currentIndex.value = 0;
    isFlipped.value = false;
    return;
  }

  stopSpeech();
  currentIndex.value = index;
  isFlipped.value = false;
}

function nextCard() {
  if (!words.value.length) {
    return;
  }
  const nextIndex = (currentIndex.value + 1) % words.value.length;
  showCard(nextIndex);
}

function previousCard() {
  if (!words.value.length) {
    return;
  }
  const previousIndex = (currentIndex.value - 1 + words.value.length) % words.value.length;
  showCard(previousIndex);
}

function shuffleCards() {
  if (!words.value.length) {
    return;
  }

  stopSpeech();
  const shuffled = cloneWords(words.value);
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  words.value = shuffled;
  currentIndex.value = 0;
  isFlipped.value = false;
}

function flipCard() {
  if (suppressNextFlip.value) {
    suppressNextFlip.value = false;
    return;
  }
  isFlipped.value = !isFlipped.value;
}

function onTouchStart(event) {
  const touch = event.changedTouches[0];
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
}

function onTouchEnd(event) {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX.value;
  const deltaY = touch.clientY - touchStartY.value;
  const horizontalThreshold = 45;
  const isHorizontalSwipe =
    Math.abs(deltaX) > horizontalThreshold && Math.abs(deltaX) > Math.abs(deltaY);

  if (!isHorizontalSwipe) {
    return;
  }

  suppressNextFlip.value = true;
  if (deltaX < 0) {
    nextCard();
  } else {
    previousCard();
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

  const wanted = ttsAccent.value.toLowerCase();
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
  if (!ttsSupported || !currentWord.value) {
    return;
  }

  if (isSpeaking.value) {
    stopSpeech();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(currentWord.value.english);
  utterance.lang = ttsAccent.value;
  utterance.rate = 0.95;

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
}

function handleKeyboardNav(event) {
  const targetTag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : '';
  const isTypingField =
    targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select' || event.target?.isContentEditable;
  if (isTypingField) {
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    previousCard();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    nextCard();
  }
}

watch(selectedList, (newList) => {
  loadList(newList);
});

watch(ttsAccent, (accent) => {
  if (accent !== 'en-US' && accent !== 'en-GB') {
    return;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(ttsStorageKey, accent);
  }
});

onMounted(() => {
  if (typeof window !== 'undefined') {
    const savedAccent =
      localStorage.getItem(ttsStorageKey) || localStorage.getItem(legacyTtsStorageKey);
    if (savedAccent === 'en-US' || savedAccent === 'en-GB') {
      ttsAccent.value = savedAccent;
      localStorage.setItem(ttsStorageKey, savedAccent);
    }
  }

  loadList(selectedList.value);
  window.addEventListener('keydown', handleKeyboardNav);

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
  window.removeEventListener('keydown', handleKeyboardNav);
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
  <section class="page-block vocab-page">
    <h1>Langues - Anglais</h1>

    <div class="settings-box">
      <label for="vocabListSelect">Choisir une liste :</label>
      <select id="vocabListSelect" v-model="selectedList">
        <option v-for="list in vocabListOptions" :key="list.key" :value="list.key">
          {{ list.label }}
        </option>
      </select>

      <label for="ttsAccentSelect">Prononciation :</label>
      <select id="ttsAccentSelect" v-model="ttsAccent">
        <option value="en-US">🇺🇸 Anglais américain</option>
        <option value="en-GB">🇬🇧 Anglais britannique</option>
      </select>
    </div>

    <div class="score">Carte {{ cardNumber }} / {{ totalCards }}</div>

    <div class="flashcard-carousel">
      <button
        class="carousel-arrow"
        type="button"
        aria-label="Carte précédente"
        @click="previousCard"
      >
        ❮
      </button>

      <div
        class="flashcard"
        :class="{ flipped: isFlipped }"
        @click="flipCard"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <div v-if="ttsSupported" class="tts-inline-control">
          <div class="tts-inline-label">Écouter</div>
          <button
            class="tts-inline-btn"
            type="button"
            :aria-label="isSpeaking ? 'Arrêter la lecture' : 'Écouter le mot'"
            @click.stop="toggleSpeakWord"
          >
            {{ isSpeaking ? '⏹️' : '▶️' }}
          </button>
        </div>

        <div class="flashcard-content">
          <div class="flashcard-word">{{ currentWord ? currentWord.english : 'Chargement...' }}</div>
          <div class="flashcard-translation" :style="{ display: isFlipped ? 'block' : 'none' }">
            {{ currentWord ? currentWord.french : '' }}
          </div>
        </div>

        <div v-if="!isFlipped" class="flashcard-hint">Cliquez pour révéler la traduction</div>
      </div>

      <button class="carousel-arrow" type="button" aria-label="Carte suivante" @click="nextCard">
        ❯
      </button>
    </div>

    <div v-if="ttsStatus" class="tts-status" aria-live="polite">{{ ttsStatus }}</div>

    <div class="vocab-controls">
      <button class="btn btn-secondary" type="button" @click="shuffleCards">🔀 Mélanger</button>
    </div>
  </section>
</template>

<style scoped>
.vocab-page {
  max-width: 760px;
  margin-inline: auto;
}

.settings-box {
  background: rgba(255, 230, 109, 0.2);
  padding: 18px;
  border-radius: 14px;
  margin-bottom: 18px;
}

.settings-box label {
  display: block;
  margin: 0 0 8px;
  font-weight: 700;
}

.settings-box label + select {
  margin-bottom: 12px;
}

.settings-box select {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #b6c7db;
  background: white;
}

.score {
  text-align: center;
  font-size: 1.2em;
  margin-bottom: 14px;
  font-weight: 700;
  padding: 12px;
  border-radius: 12px;
  background: rgba(78, 205, 196, 0.14);
}

.flashcard-carousel {
  display: grid;
  grid-template-columns: 52px 1fr 52px;
  align-items: center;
  gap: 10px;
}

.carousel-arrow {
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #a29bfe, #6c5ce7);
  color: #fff;
  font-size: 1.3em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flashcard {
  position: relative;
  background: #fff;
  border-radius: 18px;
  min-height: 260px;
  padding: 42px 22px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(36, 48, 65, 0.13);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.flashcard.flipped {
  background: linear-gradient(135deg, #4ecdc4, #6fe7dd);
  color: #fff;
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
  left: 12px;
  right: 12px;
  text-align: center;
  font-size: 0.9em;
  opacity: 0.72;
}

.tts-inline-control {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.tts-inline-label {
  font-size: 0.82em;
  font-weight: 700;
  margin-bottom: 6px;
  opacity: 0.88;
}

.tts-inline-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 2px solid rgba(36, 48, 65, 0.2);
  background: #fff;
  color: #243041;
  font-size: 1.15em;
  cursor: pointer;
}

.flashcard.flipped .tts-inline-btn {
  border-color: rgba(15, 95, 90, 0.35);
  color: #0f5f5a;
}

.tts-status {
  min-height: 1.2em;
  text-align: center;
  margin-top: 10px;
  font-weight: 700;
  color: #5d6c80;
}

.vocab-controls {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-secondary {
  background: linear-gradient(135deg, #a29bfe, #6c5ce7);
  color: white;
}

@media (max-width: 820px) {
  .flashcard-carousel {
    grid-template-columns: 44px 1fr 44px;
    gap: 6px;
  }

  .carousel-arrow {
    width: 44px;
    height: 44px;
    font-size: 1.1em;
  }

  .flashcard {
    min-height: 230px;
    padding: 36px 16px;
  }

  .flashcard-word,
  .flashcard-translation {
    font-size: clamp(1.6em, 7.5vw, 2em);
  }

  .tts-inline-control {
    right: 8px;
  }
}
</style>


