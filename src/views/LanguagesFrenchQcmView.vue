<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MotivationToast from '@/components/MotivationToast.vue';
import QuizActions from '@/components/QuizActions.vue';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import QuizFeedbackBanner from '@/components/QuizFeedbackBanner.vue';
import QuizScoreBar from '@/components/QuizScoreBar.vue';
import { useQuizFlow } from '@/composables/useQuizFlow';
import { getFrenchVerb } from '@/features/languages/frenchConjugations';
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

const route = useRoute();
const router = useRouter();

const verbKey = computed(() => {
  const value = route.params.verbKey;
  return typeof value === 'string' ? value : '';
});

const verb = computed(() => getFrenchVerb(verbKey.value));
const sessionStorage = computed(() => createFrenchModeSessionStore('qcm', verbKey.value));
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

function goBack() {
  router.push({ name: 'languages-french' });
}

function loadNextQuestion() {
  nextQuestion({
    isReady: () => Boolean(questionBag.value),
    buildQuestion: () => questionBag.value?.next() || null,
  });
  selectedOptionId.value = '';
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

onMounted(() => {
  if (verb.value) {
    questionBag.value = createFrenchQcmBag(verb.value.key);
    bestScore.value = sessionStorage.value.readBestScore();
    loadNextQuestion();
  }

  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  clearAutoNextTimeout();
  clearToastTimeout();
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <section class="page-block quiz-module french-qcm-page">
    <div class="french-qcm-page__header">
      <button class="mp-btn mp-btn-secondary" type="button" @click="goBack">← Retour au hub</button>
      <div>
        <h1>🇫🇷 Français - QCM</h1>
        <p v-if="verb" class="french-qcm-page__subtitle">
          Conjugue <strong>{{ verb.label }}</strong> au présent.
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
        <p class="french-qcm-page__prompt">Choisis la bonne conjugaison :</p>
        <h2>{{ currentQuestion.prompt }}</h2>
      </div>

      <div v-if="currentQuestion" class="grid w-full max-w-[760px] grid-cols-1 gap-3 md:grid-cols-2 mx-auto">
        <button
          v-for="(option, idx) in currentQuestion.options"
          :key="option.id"
          class="qcm-option-btn"
          :class="optionStateClass(option)"
          type="button"
          @click="selectOption(option.id)"
        >
          <span class="qcm-option-btn__index">{{ optionLabels[idx] }}</span>
          <span class="qcm-option-btn__answer">{{ option.answer }}</span>
        </button>
      </div>

      <QuizActions :can-check="canCheck" check-label="Vérifier ✓" next-label="Question suivante →" @check="checkAnswer" @next="loadNextQuestion" />

      <p class="hint">Raccourcis clavier : 1, 2, 3, 4 pour répondre, Entrée pour vérifier puis continuer.</p>
    </template>
  </section>
</template>

<style scoped>
.french-qcm-page {
  display: grid;
  gap: 18px;
}

.french-qcm-page__header {
  display: grid;
  gap: 14px;
}

.french-qcm-page__header h1 {
  margin: 0;
}

.french-qcm-page__subtitle {
  margin: 4px 0 0;
  color: #2b4461;
  font-weight: 700;
}

.prompt-box {
  max-width: 720px;
  margin: 0 auto 8px;
  text-align: center;
}

.french-qcm-page__prompt {
  margin: 0 0 6px;
  font-weight: 700;
}

.prompt-box h2 {
  margin: 0;
}

.qcm-option-btn {
  position: relative;
  border: 1px solid #8ea8c2;
  border-radius: 12px;
  background: #fbfdff;
  padding: 18px 16px 16px;
  display: grid;
  gap: 10px;
  align-content: center;
  min-height: 110px;
  cursor: pointer;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.12);
  transition:
    transform 0.12s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.qcm-option-btn:hover {
  background: #ebf4ff;
  border-color: #55789e;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
}

.qcm-option-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.14);
}

.qcm-option-btn__index {
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

.qcm-option-btn__answer {
  font-weight: 800;
  font-size: 1.18rem;
  color: #17304d;
  text-align: center;
}

.qcm-option-btn.is-selected {
  border-color: #155e75;
  background: #f1fbfb;
  box-shadow:
    0 0 0 2px rgba(21, 94, 117, 0.22),
    0 10px 18px rgba(15, 23, 42, 0.14);
  transform: translateY(-1px);
}

.qcm-option-btn.is-correct {
  border-color: #2fa36b;
  background: #f0fff7;
}

.qcm-option-btn.is-incorrect {
  border-color: #d95f5f;
  background: #fff3f3;
}

.french-qcm-page :deep(.mp-actions) {
  margin-top: 6px;
}

.hint {
  margin: 6px 0 0;
  text-align: center;
  color: var(--muted);
  font-size: 0.88rem;
}
</style>
