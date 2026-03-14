<script setup>
import { computed } from 'vue';
import { getDrawingGuidedLessonSummaries } from '@/features/arts/drawingGuidedStore';

const lessons = computed(() => getDrawingGuidedLessonSummaries());

function formatDuration(value) {
  if (!Number.isInteger(value) || value <= 0) {
    return 'Durée courte';
  }

  return `${value} min`;
}
</script>

<template>
  <section class="page-block drawing-guided-page">
    <header class="drawing-guided-hero">
      <div>
        <p class="drawing-guided-kicker">Arts plastiques</p>
        <h1>✏️ Dessin guidé</h1>
        <p class="drawing-guided-intro">
          Observe chaque étape, dessine sur papier, puis avance jusqu'au résultat final.
        </p>
      </div>
    </header>

    <div class="drawing-guided-grid">
      <router-link
        v-for="lesson in lessons"
        :key="lesson.key"
        class="drawing-guided-card"
        :to="{ name: 'arts-drawing-guided-lesson', params: { lessonKey: lesson.key } }"
      >
        <div class="drawing-guided-card__image">
          <img v-if="lesson.finalImage" :src="lesson.finalImage" :alt="`Aperçu final ${lesson.title}`" />
        </div>
        <div class="drawing-guided-card__body">
          <div class="drawing-guided-card__meta">
            <span>{{ lesson.level }}</span>
            <span>{{ formatDuration(lesson.durationMinutes) }}</span>
          </div>
          <h2>{{ lesson.title }}</h2>
          <p>{{ lesson.subtitle }}</p>
          <div class="drawing-guided-card__footer">
            <span>{{ lesson.steps }} étapes</span>
            <span>Commencer</span>
          </div>
        </div>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.drawing-guided-page {
  display: grid;
  gap: 18px;
}

.drawing-guided-hero {
  display: grid;
  gap: 10px;
}

.drawing-guided-kicker {
  margin: 0 0 6px;
  color: #7f5b1f;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.drawing-guided-intro {
  margin: 0;
  max-width: 680px;
  color: #34465d;
  line-height: 1.5;
}

.drawing-guided-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.drawing-guided-card {
  display: grid;
  overflow: hidden;
  border: 1px solid #d5dce6;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdf8 0%, #f9fbff 100%);
  box-shadow: 0 10px 22px rgba(36, 48, 65, 0.08);
  transition:
    transform 0.12s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.drawing-guided-card:hover,
.drawing-guided-card:focus-visible {
  transform: translateY(-2px);
  border-color: #9eb3cf;
  box-shadow: 0 16px 28px rgba(36, 48, 65, 0.12);
}

.drawing-guided-card__image {
  display: grid;
  place-items: center;
  min-height: 184px;
  padding: 14px;
  background:
    radial-gradient(circle at top, rgba(255, 214, 102, 0.18), transparent 50%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-bottom: 1px solid #e2e8f0;
}

.drawing-guided-card__image img {
  max-width: 100%;
  max-height: 156px;
  object-fit: contain;
}

.drawing-guided-card__body {
  display: grid;
  gap: 10px;
  padding: 16px;
}

.drawing-guided-card__meta,
.drawing-guided-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #5b6e82;
  font-size: 0.86rem;
  font-weight: 700;
}

.drawing-guided-card__body h2 {
  margin: 0;
}

.drawing-guided-card__body p {
  margin: 0;
  color: #34465d;
  line-height: 1.5;
}
</style>
