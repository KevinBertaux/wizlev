<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import QuizEmptyState from '@/components/QuizEmptyState.vue';
import { getDrawingGuidedLessonByKey, getDrawingGuidedLessonSummaries } from '@/features/arts/drawingGuidedStore';

const route = useRoute();

const lesson = computed(() => getDrawingGuidedLessonByKey(route.params.lessonKey));
const stepIndex = computed(() => {
  const raw = Number.parseInt(String(route.query.step || '1'), 10);
  return Number.isFinite(raw) && raw > 0 ? raw - 1 : 0;
});

const currentStep = computed(() => {
  const steps = lesson.value?.steps || [];
  return steps[Math.min(stepIndex.value, Math.max(steps.length - 1, 0))] || null;
});

const previousStepQuery = computed(() => ({ step: Math.max(1, (currentStep.value?.index || 1) - 1) }));
const nextStepQuery = computed(() => ({ step: Math.min(lesson.value?.steps.length || 1, (currentStep.value?.index || 1) + 1) }));
const siblingLessons = computed(() => getDrawingGuidedLessonSummaries());
</script>

<template>
  <section v-if="lesson && currentStep" class="page-block drawing-lesson">
    <header class="drawing-lesson__header">
      <div>
        <p class="drawing-lesson__kicker">Arts plastiques · Dessin guidé</p>
        <h1>{{ lesson.title }}</h1>
        <p class="drawing-lesson__subtitle">{{ lesson.subtitle }}</p>
      </div>
      <div class="drawing-lesson__progress">Étape {{ currentStep.index }} / {{ lesson.steps.length }}</div>
    </header>

    <div class="drawing-lesson__stage">
      <div class="drawing-lesson__image-card">
        <img :src="currentStep.image" :alt="`${lesson.title} - étape ${currentStep.index}`" />
      </div>

      <aside class="drawing-lesson__sidebar">
        <div class="drawing-lesson__instruction">
          <h2>Consigne</h2>
          <p>{{ currentStep.instruction }}</p>
        </div>

        <div class="drawing-lesson__final">
          <h2>Résultat final</h2>
          <img :src="lesson.finalImage" :alt="`Résultat final ${lesson.title}`" />
        </div>
      </aside>
    </div>

    <nav class="drawing-lesson__nav" aria-label="Navigation étapes">
      <router-link
        class="drawing-lesson__btn"
        :class="{ 'is-disabled': currentStep.index <= 1 }"
        :to="{ name: 'arts-drawing-guided-lesson', params: { lessonKey: lesson.key }, query: previousStepQuery }"
      >
        ← Étape précédente
      </router-link>

      <router-link class="drawing-lesson__btn is-secondary" :to="{ name: 'arts-drawing-guided' }">
        Toutes les fiches
      </router-link>

      <router-link
        class="drawing-lesson__btn"
        :class="{ 'is-disabled': currentStep.index >= lesson.steps.length }"
        :to="{ name: 'arts-drawing-guided-lesson', params: { lessonKey: lesson.key }, query: nextStepQuery }"
      >
        Étape suivante →
      </router-link>
    </nav>

    <section class="drawing-lesson__timeline">
      <h2>Étapes</h2>
      <div class="drawing-lesson__timeline-grid">
        <router-link
          v-for="step in lesson.steps"
          :key="`${lesson.key}-${step.index}`"
          class="drawing-lesson__timeline-card"
          :class="{ 'is-active': step.index === currentStep.index }"
          :to="{ name: 'arts-drawing-guided-lesson', params: { lessonKey: lesson.key }, query: { step: step.index } }"
        >
          <img :src="step.image" :alt="`${lesson.title} - miniature étape ${step.index}`" />
          <strong>Étape {{ step.index }}</strong>
        </router-link>
      </div>
    </section>

    <section class="drawing-lesson__other">
      <h2>Autres fiches</h2>
      <div class="drawing-lesson__other-links">
        <router-link
          v-for="item in siblingLessons"
          :key="item.key"
          class="drawing-lesson__other-link"
          :to="{ name: 'arts-drawing-guided-lesson', params: { lessonKey: item.key } }"
        >
          {{ item.title }}
        </router-link>
      </div>
    </section>
  </section>

  <QuizEmptyState v-else message="Cette fiche de dessin guidé n'est pas disponible." />
</template>

<style scoped>
.drawing-lesson {
  display: grid;
  gap: 18px;
}

.drawing-lesson__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.drawing-lesson__kicker {
  margin: 0 0 6px;
  color: #7f5b1f;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.drawing-lesson__subtitle {
  margin: 8px 0 0;
  color: #34465d;
  line-height: 1.5;
}

.drawing-lesson__progress {
  border: 1px solid #d9e4ef;
  border-radius: 999px;
  padding: 8px 12px;
  background: #f8fbff;
  color: #284862;
  font-size: 0.9rem;
  font-weight: 800;
  white-space: nowrap;
}

.drawing-lesson__stage {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 18px;
}

.drawing-lesson__image-card,
.drawing-lesson__instruction,
.drawing-lesson__final,
.drawing-lesson__timeline,
.drawing-lesson__other {
  border: 1px solid #d9e4ef;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 10px 24px rgba(36, 48, 65, 0.06);
}

.drawing-lesson__image-card {
  display: grid;
  place-items: center;
  padding: 20px;
  min-height: 420px;
}

.drawing-lesson__image-card img {
  width: min(100%, 720px);
  max-height: 520px;
  object-fit: contain;
}

.drawing-lesson__sidebar {
  display: grid;
  gap: 16px;
}

.drawing-lesson__instruction,
.drawing-lesson__final,
.drawing-lesson__timeline,
.drawing-lesson__other {
  padding: 16px;
}

.drawing-lesson__instruction h2,
.drawing-lesson__final h2,
.drawing-lesson__timeline h2,
.drawing-lesson__other h2 {
  margin: 0 0 10px;
}

.drawing-lesson__instruction p {
  margin: 0;
  color: #34465d;
  font-size: 1.05rem;
  line-height: 1.6;
}

.drawing-lesson__final img {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
}

.drawing-lesson__nav {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.drawing-lesson__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid #bfd1e8;
  border-radius: 12px;
  background: linear-gradient(150deg, #fbfdff 0%, #f2f8ff 100%);
  color: #1f3650;
  font-weight: 800;
}

.drawing-lesson__btn.is-secondary {
  border-color: #d9e4ef;
  background: #fffdf8;
}

.drawing-lesson__btn.is-disabled {
  opacity: 0.6;
}

.drawing-lesson__timeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.drawing-lesson__timeline-card {
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 10px;
  border: 1px solid #d9e4ef;
  border-radius: 14px;
  background: #ffffff;
}

.drawing-lesson__timeline-card.is-active {
  border-color: #86adc9;
  background: #eef7ff;
  box-shadow: inset 0 0 0 1px rgba(93, 145, 185, 0.18);
}

.drawing-lesson__timeline-card img {
  width: 100%;
  height: 88px;
  object-fit: contain;
}

.drawing-lesson__other-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.drawing-lesson__other-link {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid #d9e4ef;
  border-radius: 999px;
  background: #ffffff;
  color: #284862;
  font-weight: 700;
}

@media (max-width: 960px) {
  .drawing-lesson__header,
  .drawing-lesson__stage {
    grid-template-columns: 1fr;
    display: grid;
  }

  .drawing-lesson__progress {
    justify-self: start;
  }

  .drawing-lesson__image-card {
    min-height: 300px;
  }
}
</style>
