<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import StudyFlashcardCarousel from '@/components/StudyFlashcardCarousel.vue';
import { buildFrenchVerbCards, getFrenchVerb } from '@/features/languages/frenchConjugations';

const ttsSupported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window;
const ttsPlaybackRates = [0.9, 0.6];
const isiOSLike =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
  (typeof navigator !== 'undefined' &&
    navigator.platform === 'MacIntel' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1);

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
defineEmits(['summary-update']);

const flashcardState = ref({
  currentCard: null,
  currentIndex: 0,
  totalCards: 0,
  isFlipped: false,
});
const ttsNextRateIndex = ref(0);
const ttsVoices = ref([]);
const selectedVoiceUri = ref('');
const isSpeaking = ref(false);
const ttsStatus = ref('');

let currentUtterance = null;
let voicesChangedHandler = null;

const verb = computed(() => getFrenchVerb(props.verbKey, props.source, props.moodKey, props.tenseKey));
const cards = computed(() =>
  buildFrenchVerbCards(props.verbKey, props.tenseKey, props.source, props.moodKey).map((card) => ({
    id: card.id,
    front: card.prompt,
    back: card.answer,
  }))
);
const canPlayTts = computed(
  () => ttsSupported && !!flashcardState.value.currentCard?.back && flashcardState.value.isFlipped
);
const availableVoiceOptions = computed(() => {
  const seen = new Set();
  return ttsVoices.value
    .filter((item) => normalizeVoiceLang(item.lang).startsWith('fr'))
    .filter((item) => {
      if (!item.voiceURI || seen.has(item.voiceURI)) {
        return false;
      }
      seen.add(item.voiceURI);
      return true;
    })
    .map((item) => ({
      value: item.voiceURI,
      label: item.name.replace(/^Microsoft\s+/i, '').trim(),
    }));
});

function normalizeVoiceLang(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
}

function refreshVoices() {
  if (!ttsSupported) {
    ttsVoices.value = [];
    return;
  }
  ttsVoices.value = speechSynthesis.getVoices();
  if (!selectedVoiceUri.value && ttsVoices.value.length) {
    const preferredVoice = findBestVoice();
    selectedVoiceUri.value = preferredVoice?.voiceURI || '';
  }
}

function findBestVoice() {
  if (!ttsVoices.value.length) {
    return null;
  }

  if (selectedVoiceUri.value) {
    const selectedVoice = ttsVoices.value.find((item) => item.voiceURI === selectedVoiceUri.value);
    if (selectedVoice) {
      return selectedVoice;
    }
  }

  if (isiOSLike) {
    let voice = ttsVoices.value.find((item) => {
      const lang = normalizeVoiceLang(item.lang);
      return lang.startsWith('fr') && /am[ée]lie/i.test(item.name || '');
    });
    if (voice) {
      return voice;
    }
  }

  let voice = ttsVoices.value.find((item) => {
    const lang = normalizeVoiceLang(item.lang);
    return lang.startsWith('fr') && /google/i.test(item.name || '');
  });
  if (voice) {
    return voice;
  }

  const wanted = 'fr-fr';
  voice = ttsVoices.value.find((item) => normalizeVoiceLang(item.lang) === wanted);
  if (voice) {
    return voice;
  }

  voice = ttsVoices.value.find(
    (item) => normalizeVoiceLang(item.lang).startsWith(wanted)
  );
  if (voice) {
    return voice;
  }

  return ttsVoices.value.find((item) => normalizeVoiceLang(item.lang).startsWith('fr'));
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

function toggleSpeakCard() {
  if (!canPlayTts.value) {
    return;
  }

  if (isSpeaking.value) {
    stopSpeech();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(flashcardState.value.currentCard.back);
  utterance.lang = 'fr-FR';
  utterance.rate = ttsPlaybackRates[ttsNextRateIndex.value] || 1;

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

onMounted(() => {
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
  <template v-if="verb && cards.length">
    <StudyFlashcardCarousel
      :cards="cards"
      hint="Cliquer pour révéler la conjugaison"
      shuffle-label="🔀 Mélanger les cartes"
      @state-change="handleFlashcardStateChange"
    >
      <template v-if="ttsSupported" #actions>
        <label class="tts-voice-picker">
          <span class="tts-voice-picker__label">Voix</span>
          <select v-model="selectedVoiceUri" @click.stop>
            <option value="">Voix système</option>
            <option v-for="voice in availableVoiceOptions" :key="voice.value" :value="voice.value">
              {{ voice.label }}
            </option>
          </select>
        </label>
      </template>

      <template v-if="ttsSupported" #aside-control>
        <button
          class="tts-inline-btn"
          :class="{ 'is-speaking': isSpeaking }"
          type="button"
          :disabled="!canPlayTts"
          :aria-disabled="!canPlayTts"
          :aria-label="isSpeaking ? 'Arrêter la lecture' : 'Écouter la conjugaison'"
          @click.stop="toggleSpeakCard"
        >
          <span class="tts-icon" aria-hidden="true">🔊</span>
        </button>
      </template>
    </StudyFlashcardCarousel>

    <div v-if="ttsStatus" class="tts-status" aria-live="polite">{{ ttsStatus }}</div>
  </template>

  <QuizEmptyState v-else message="Verbe introuvable." />
</template>

<style scoped>
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
  border-color: #0f5f5a;
  background: #ecfbf9;
  box-shadow:
    0 8px 16px rgba(15, 23, 42, 0.16),
    0 0 0 4px rgba(15, 95, 90, 0.2);
  animation: tts-speaking-pulse 0.9s ease-in-out infinite alternate;
}

.tts-inline-btn.is-speaking::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid rgba(15, 95, 90, 0.32);
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

.tts-status {
  min-height: 1.2em;
  text-align: center;
  margin-top: 10px;
  font-weight: 700;
  color: #5d6c80;
}

.tts-voice-picker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #35516e;
  font-weight: 700;
}

.tts-voice-picker__label {
  font-size: 0.92rem;
}

.tts-voice-picker select {
  min-width: 120px;
  border: 1px solid rgba(53, 81, 110, 0.24);
  border-radius: 999px;
  background: #fbfdff;
  color: #243041;
  font: inherit;
  padding: 10px 14px;
}

@keyframes tts-speaking-pulse {
  0% {
    transform: translateY(-2px) scale(1);
  }
  100% {
    transform: translateY(-2px) scale(1.04);
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

@media (max-width: 767px) {
  .tts-inline-btn {
    width: 44px;
    height: 44px;
    font-size: 1.05rem;
    border-width: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tts-inline-btn.is-speaking,
  .tts-inline-btn.is-speaking::after {
    animation: none !important;
  }
}
</style>
