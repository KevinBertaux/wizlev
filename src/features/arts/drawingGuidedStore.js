import manifest from '@/content/arts/drawing-guided/manifest.json';

const lessonModules = import.meta.glob('@/content/arts/drawing-guided/lessons/*.json', {
  eager: true,
  import: 'default',
});

function normalizeLessonSummary(item) {
  return {
    key: typeof item?.key === 'string' ? item.key : '',
    file: typeof item?.file === 'string' ? item.file : '',
    title: typeof item?.title === 'string' ? item.title : '',
    level: typeof item?.level === 'string' ? item.level : 'debutant',
    steps: Number.isInteger(item?.steps) ? item.steps : 0,
    tags: Array.isArray(item?.tags) ? item.tags.filter((tag) => typeof tag === 'string') : [],
    coverImage: typeof item?.coverImage === 'string' ? item.coverImage : '',
  };
}

function normalizeStep(step, index) {
  return {
    index: Number.isInteger(step?.index) ? step.index : index + 1,
    instruction: typeof step?.instruction === 'string' ? step.instruction : '',
    image: typeof step?.image === 'string' ? step.image : '',
  };
}

function normalizeLesson(lesson) {
  const steps = Array.isArray(lesson?.steps) ? lesson.steps.map(normalizeStep).filter((step) => step.instruction) : [];

  return {
    key: typeof lesson?.key === 'string' ? lesson.key : '',
    title: typeof lesson?.title === 'string' ? lesson.title : '',
    subtitle: typeof lesson?.subtitle === 'string' ? lesson.subtitle : '',
    level: typeof lesson?.level === 'string' ? lesson.level : 'debutant',
    language: typeof lesson?.language === 'string' ? lesson.language : 'fr',
    durationMinutes: Number.isInteger(lesson?.durationMinutes) ? lesson.durationMinutes : null,
    finalImage: typeof lesson?.finalImage === 'string' ? lesson.finalImage : '',
    steps,
  };
}

function buildLessonsByKey() {
  return new Map(
    Object.values(lessonModules)
      .map(normalizeLesson)
      .filter((lesson) => lesson.key)
      .map((lesson) => [lesson.key, lesson])
  );
}

const lessonsByKey = buildLessonsByKey();

export function getDrawingGuidedManifest() {
  const lessons = Array.isArray(manifest?.lessons) ? manifest.lessons.map(normalizeLessonSummary).filter((item) => item.key) : [];

  return {
    version: typeof manifest?.version === 'string' ? manifest.version : '',
    category: typeof manifest?.category === 'string' ? manifest.category : 'arts-plastiques',
    module: typeof manifest?.module === 'string' ? manifest.module : 'drawing-guided',
    lessons,
  };
}

export function getDrawingGuidedLessonSummaries() {
  return getDrawingGuidedManifest().lessons.map((summary) => {
    const lesson = lessonsByKey.get(summary.key);
    return {
      ...summary,
      subtitle: lesson?.subtitle || '',
      finalImage: lesson?.finalImage || summary.coverImage || '',
      durationMinutes: lesson?.durationMinutes || null,
    };
  });
}

export function getDrawingGuidedLessonByKey(lessonKey) {
  if (typeof lessonKey !== 'string' || !lessonKey.trim()) {
    return null;
  }

  return lessonsByKey.get(lessonKey.trim()) || null;
}
