<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MotivationToast from '@/components/MotivationToast.vue';
import QuizActions from '@/components/QuizActions.vue';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import QuizFeedbackBanner from '@/components/QuizFeedbackBanner.vue';
import QuizScoreBar from '@/components/QuizScoreBar.vue';
import { useQuizFlow } from '@/composables/useQuizFlow';
import { getFrenchVerb } from '@/features/languages/frenchConjugations';
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

const route = useRoute();
const router = useRouter();

const verbKey = computed(() => {
  const value = route.params.verbKey;
  return typeof value === 'string' ? value : '';
});

const verb = computed(() => getFrenchVerb(verbKey.value));
const sessionStorage = computed(() => createFrenchModeSessionStore('input', verbKey.value));
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

function goBack() {
  router.push({
    name: 'languages-french',
    query: {
      ...route.query,
      verb: verbKey.value || route.query.verb,
      mode: 'input',
    },
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

onMounted(() => {
  if (verb.value) {
    questionBag.value = createFrenchInputBag(verb.value.key);
    bestScore.value = sessionStorage.value.readBestScore();
    loadNextQuestion();
  }
});

onUnmounted(() => {
  clearAutoNextTimeout();
  clearToastTimeout();
});
</script>

<template>
  <section class="page-block quiz-module french-input-page">
    <div class="french-input-page__header">
      <button class="mp-btn mp-btn-secondary" type="button" @click="goBack">← Retour au hub</button>
      <div>
        <h1>🇫🇷 Français - Saisie</h1>
        <p v-if="verb" class="french-input-page__subtitle">
          Écris la bonne forme du verbe <strong>{{ verb.label }}</strong>.
        </p>
      </div>
    </div>

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
        <p class="french-input-page__prompt">Conjugue ce verbe :</p>
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
  </section>
</template>

<style scoped>
.french-input-page {
  display: grid;
  gap: 18px;
}

.french-input-page__header {
  display: grid;
  gap: 14px;
}

.french-input-page__header h1 {
  margin: 0;
}

.french-input-page__subtitle {
  margin: 4px 0 0;
  color: #2b4461;
  font-weight: 700;
}

.prompt-box {
  max-width: 720px;
  margin: 0 auto 8px;
  text-align: center;
}

.french-input-page__prompt {
  margin: 0 0 6px;
  font-weight: 700;
}

.prompt-box h2 {
  margin: 0;
}

.french-input-card {
  display: flex;
  justify-content: center;
}

.answer-input {
  width: min(100%, 420px);
  min-height: 72px;
  padding: 12px 16px;
  border-radius: 16px;
  border: 3px solid #58d4df;
  font-size: clamp(1.3rem, 3.2vw, 1.7rem);
  text-align: center;
  font-weight: 800;
  color: #23395d;
  background: #fff;
  box-shadow: 0 18px 34px rgba(88, 212, 223, 0.22);
}

.answer-input:focus-visible {
  outline: none;
  border-color: #2bb6c5;
  box-shadow: 0 0 0 5px rgba(88, 212, 223, 0.22);
}

.french-input-page :deep(.mp-actions) {
  margin-top: 6px;
}

.hint {
  margin: 6px 0 0;
  text-align: center;
  color: var(--muted);
  font-size: 0.88rem;
}
</style>
