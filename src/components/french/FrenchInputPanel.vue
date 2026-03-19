<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import MotivationToast from '@/components/MotivationToast.vue';
import QuizActions from '@/components/QuizActions.vue';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import QuizFeedbackBanner from '@/components/QuizFeedbackBanner.vue';
import QuizScoreBar from '@/components/QuizScoreBar.vue';
import { useQuizFlow } from '@/composables/useQuizFlow';
import { getFrenchTense, getFrenchVerb } from '@/features/languages/frenchConjugations';
import {
  createFrenchInputBag,
  evaluateFrenchInputAnswer,
} from '@/features/languages/frenchConjugationEngine';
import { createFrenchModeSessionStore } from '@/features/languages/frenchConjugationSessionStore';
import {
  buildMotivationToast,
  MOTIVATION_TOAST_DURATION_MS,
  resetMotivationRunState,
} from '@/features/motivation/toastEngine';

const AUTO_NEXT_DELAY_MS = 2000;

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
const tense = computed(() => getFrenchTense(props.tenseKey, props.source, props.moodKey));
const sessionStorage = computed(() =>
  createFrenchModeSessionStore('input', props.verbKey, props.moodKey, props.tenseKey)
);
const questionBag = ref(null);
const answerInput = ref('');
const answerField = ref(null);
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

function focusAnswerField() {
  nextTick(() => {
    answerField.value?.focus();
  });
}

function loadNextQuestion() {
  nextQuestion({
    isReady: () => Boolean(questionBag.value),
    buildQuestion: () => questionBag.value?.next() || null,
  });
  answerInput.value = '';
  focusAnswerField();
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
    ? createFrenchInputBag(props.verbKey, Math.random, props.source, props.moodKey, props.tenseKey)
    : null;
  loadNextQuestion();
}

function checkAnswer() {
  if (hasChecked.value) {
    return;
  }

  const result = evaluateFrenchInputAnswer(currentQuestion.value, answerInput.value);
  if (!result.isValid) {
    setFeedback({
      type: 'incorrect',
      main: '⚠️ Saisir une réponse avant de vérifier.',
      extra: '',
    });
    focusAnswerField();
    return;
  }

  setChecked(true);
  const { bestStreakBefore } = applyAttempt(result.isCorrect);

  if (result.isCorrect) {
    if (score.value > bestScore.value) {
      bestScore.value = score.value;
      sessionStorage.value.writeBestScore(bestScore.value);
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
    extra: `Bonne réponse : ${currentQuestion.value.pronounLabel.toLowerCase()} ${result.correctAnswer}.`,
  });
}

function onAnswerKeydown(event) {
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

onUnmounted(() => {
  clearAutoNextTimeout();
  clearToastTimeout();
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
      <p class="french-input-panel__prompt">Conjugue ce verbe :</p>
      <h2>{{ currentQuestion.prompt }}</h2>
    </div>

    <div v-if="currentQuestion" class="french-input-card">
      <input
        ref="answerField"
        v-model="answerInput"
        class="answer-input"
        type="text"
        inputmode="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Écris la bonne forme"
        @keydown="onAnswerKeydown"
      />
    </div>

    <QuizActions
      :can-check="canCheck"
      check-label="Vérifier ✓"
      next-label="Question suivante →"
      @check="checkAnswer"
      @next="loadNextQuestion"
    />

    <p class="hint">Appuie sur Entrée pour vérifier puis continuer.</p>
  </template>
</template>

<style scoped>
.french-input-panel__prompt {
  margin: 0 0 8px;
  color: #57708f;
  font-weight: 700;
}

.prompt-box,
.french-input-card,
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

.french-input-card {
  width: min(100%, 720px);
  padding: 0;
}

.french-input-card :deep(.answer-input),
.answer-input {
  display: block;
  width: 100%;
  min-height: 72px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #8ea8c2;
  background: #fbfdff;
  text-align: center;
  font-size: 1.35rem;
  font-weight: 700;
  color: #17304d;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.08);
}

.answer-input:focus-visible {
  outline: none;
  border-color: #155e75;
  box-shadow:
    0 0 0 2px rgba(21, 94, 117, 0.18),
    0 8px 16px rgba(15, 23, 42, 0.12);
}
</style>
