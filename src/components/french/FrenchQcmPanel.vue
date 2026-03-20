<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import MotivationToast from '@/components/MotivationToast.vue';
import QuizActions from '@/components/QuizActions.vue';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import QuizFeedbackBanner from '@/components/QuizFeedbackBanner.vue';
import QuizScoreBar from '@/components/QuizScoreBar.vue';
import { useQuizFlow } from '@/composables/useQuizFlow';
import { getFrenchTense, getFrenchVerb } from '@/features/languages/frenchConjugations';
import {
  createFrenchQcmBag,
  evaluateFrenchQcmAnswer,
} from '@/features/languages/frenchConjugationEngine';
import { createFrenchModeSessionStore } from '@/features/languages/frenchConjugationSessionStore';
import {
  buildMotivationToast,
  MOTIVATION_TOAST_DURATION_MS,
  resetMotivationRunState,
} from '@/features/motivation/toastEngine';

const AUTO_NEXT_DELAY_MS = 2000;
const optionLabels = ['1', '2', '3', '4'];

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
const emit = defineEmits(['summary-update']);

const verb = computed(() => getFrenchVerb(props.verbKey, props.source, props.moodKey, props.tenseKey));
const tense = computed(() => getFrenchTense(props.tenseKey, props.source, props.moodKey));
const sessionStorage = computed(() =>
  createFrenchModeSessionStore('qcm', props.verbKey, props.moodKey, props.tenseKey)
);
const questionBag = ref(null);
const selectedOptionId = ref('');
const toastMessage = ref('');
const toastTone = ref('streak');
const toastTimeoutId = ref(null);
const bestScore = ref(0);
const motivationState = ref({
  hasShownX3InSession: false,
  hasShownRecordInRun: false,
});

const {
  score,
  total,
  streak,
  bestStreak,
  currentQuestion,
  hasChecked,
  canCheck,
  feedbackType,
  feedbackMain,
  feedbackExtra,
  setFeedback,
  setChecked,
  nextQuestion,
  applyAttempt,
  scheduleAutoNext,
  clearAutoNextTimeout,
} = useQuizFlow({
  bestStreakKey: computed(() => sessionStorage.value.bestStreakKey).value,
  autoNextDelayMs: AUTO_NEXT_DELAY_MS,
});

const headerExtras = computed(() => {
  if (!verb.value) {
    return [];
  }

  return [
    `Verbe : ${verb.value.label}`,
    `Temps : ${tense.value?.label?.replace(/^[A-Za-zÀ-ÿ-]+\s+/, '') || props.tenseKey}`,
    `Meilleur score : ${bestScore.value}`,
  ];
});

function clearToastTimeout() {
  if (toastTimeoutId.value) {
    clearTimeout(toastTimeoutId.value);
    toastTimeoutId.value = null;
  }
}

function showMotivationToast(toast) {
  if (!toast) {
    return;
  }

  clearToastTimeout();
  toastTone.value = toast.tone;
  toastMessage.value = toast.message;
  toastTimeoutId.value = setTimeout(() => {
    toastTimeoutId.value = null;
    toastMessage.value = '';
  }, MOTIVATION_TOAST_DURATION_MS);
}

function loadNextQuestion() {
  nextQuestion({
    isReady: () => Boolean(questionBag.value),
    buildQuestion: () => questionBag.value?.next() || null,
  });
  selectedOptionId.value = '';
}

function resetPanel() {
  clearAutoNextTimeout();
  clearToastTimeout();
  toastMessage.value = '';
  toastTone.value = 'streak';
  bestScore.value = sessionStorage.value.readBestScore();
  motivationState.value = {
    hasShownX3InSession: false,
    hasShownRecordInRun: false,
  };
  questionBag.value = verb.value
    ? createFrenchQcmBag(props.verbKey, Math.random, props.source, props.moodKey, props.tenseKey)
    : null;
  loadNextQuestion();
  emit('summary-update');
}

function optionStateClass(option) {
  if (!hasChecked.value) {
    return selectedOptionId.value === option.id ? 'is-selected' : '';
  }

  if (option.id === currentQuestion.value.correctOptionId) {
    return 'is-correct';
  }

  if (option.id === selectedOptionId.value && option.id !== currentQuestion.value.correctOptionId) {
    return 'is-incorrect';
  }

  return '';
}

function selectOption(optionId) {
  if (hasChecked.value) {
    return;
  }
  selectedOptionId.value = optionId;
}

function checkAnswer() {
  if (hasChecked.value) {
    return;
  }

  const result = evaluateFrenchQcmAnswer(currentQuestion.value, selectedOptionId.value);
  if (!result.isValid) {
    setFeedback({
      type: 'incorrect',
      main: '⚠️ Choisir une réponse avant de vérifier.',
      extra: '',
    });
    return;
  }

  setChecked(true);
  const { bestStreakBefore } = applyAttempt(result.isCorrect);
  emit('summary-update');

  if (result.isCorrect) {
    if (score.value > bestScore.value) {
      bestScore.value = score.value;
      sessionStorage.value.writeBestScore(bestScore.value);
      emit('summary-update');
    }

    const motivation = buildMotivationToast({
      streak: streak.value,
      bestStreakBefore,
      state: motivationState.value,
    });
    motivationState.value = motivation.state;
    showMotivationToast(motivation.toast);

    setFeedback({
      type: 'correct',
      main: 'Bonne réponse.',
      extra: '',
    });
    scheduleAutoNext(() => {
      loadNextQuestion();
    });
    return;
  }

  motivationState.value = resetMotivationRunState(motivationState.value);
  setFeedback({
    type: 'incorrect',
    main: '❌ Mauvaise réponse.',
    extra: `Bonne réponse : ${currentQuestion.value.expectedAnswerLabel}.`,
  });
}

function onKeydown(event) {
  const mapping = {
    1: 0,
    2: 1,
    3: 2,
    4: 3,
  };

  if (event.key in mapping) {
    const option = currentQuestion.value?.options?.[mapping[event.key]];
    if (option) {
      selectOption(option.id);
    }
  }

  if (event.key === 'Enter') {
    if (hasChecked.value) {
      loadNextQuestion();
    } else {
      checkAnswer();
    }
  }
}

watch(
  () => [props.verbKey, props.moodKey, props.tenseKey],
  () => {
    if (verb.value) {
      resetPanel();
    } else {
      questionBag.value = null;
    }
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  clearAutoNextTimeout();
  clearToastTimeout();
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <QuizEmptyState v-if="!verb" message="Verbe introuvable." />

  <template v-else>
    <QuizScoreBar
      :score="score"
      :total="total"
      :streak="streak"
      :best-streak="bestStreak"
      :extras="headerExtras"
    />

    <div class="motivation-toast-anchor">
      <MotivationToast :message="toastMessage" :tone="toastTone" />
    </div>

    <QuizFeedbackBanner
      v-if="feedbackMain"
      :type="feedbackType"
      :main="feedbackMain"
      :extra="feedbackExtra"
    />

    <div v-if="currentQuestion" class="prompt-box">
      <p class="french-qcm-panel__prompt">Choisis la bonne forme :</p>
      <h2>{{ currentQuestion.prompt }}</h2>
    </div>

    <div v-if="currentQuestion" class="french-qcm-panel__options">
      <button
        v-for="(option, index) in currentQuestion.options"
        :key="option.id"
        class="french-qcm-panel__option"
        :class="optionStateClass(option)"
        type="button"
        @click="selectOption(option.id)"
      >
        <span class="french-qcm-panel__option-index">{{ optionLabels[index] }}.</span>
        <span>{{ option.answer }}</span>
      </button>
    </div>

    <QuizActions
      :can-check="canCheck"
      check-label="Vérifier ✓"
      next-label="Question suivante →"
      @check="checkAnswer"
      @next="loadNextQuestion"
    />

    <p class="hint">Clavier : 1, 2, 3, 4 puis Entrée.</p>
  </template>
</template>

<style scoped>
.french-qcm-panel__prompt {
  margin: 0 0 8px;
  color: #57708f;
  font-weight: 700;
}

.french-qcm-panel__options {
  margin: 0 auto;
  display: grid;
  width: 100%;
  max-width: 720px;
  grid-template-columns: 1fr;
  gap: 8px;
}

.prompt-box,
:deep(.mp-actions),
.hint,
:deep(.mp-panel-info),
:deep(.mp-feedback) {
  max-width: 720px;
  margin-inline: auto;
}

.prompt-box,
.hint {
  text-align: center;
}

.french-qcm-panel__option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 72px;
  padding: 14px 18px;
  border: 1px solid #8ea8c2;
  border-radius: 12px;
  background: #fbfdff;
  color: #17304d;
  font: inherit;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.12);
  transition:
    transform 0.12s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.french-qcm-panel__option:hover {
  background: #ebf4ff;
  border-color: #55789e;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
}

.french-qcm-panel__option:active {
  transform: translateY(0);
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.14);
}

.french-qcm-panel__option.is-selected {
  border-color: #155e75;
  background: #f1fbfb;
  box-shadow:
    0 0 0 2px rgba(21, 94, 117, 0.22),
    0 10px 18px rgba(15, 23, 42, 0.14);
  transform: translateY(-1px);
}

.french-qcm-panel__option.is-correct {
  border-color: #2fa36b;
  background: #f0fff7;
}

.french-qcm-panel__option.is-incorrect {
  border-color: #d95f5f;
  background: #fff3f3;
}

.french-qcm-panel__option-index {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 24px;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.2;
  color: #243041;
  background: #e6f9f7;
  border: 1px solid #bfece7;
  text-align: center;
}

@media (min-width: 768px) {
  .french-qcm-panel__options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
