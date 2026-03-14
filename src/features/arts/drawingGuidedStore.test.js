import { describe, expect, it } from 'vitest';
import {
  getDrawingGuidedLessonByKey,
  getDrawingGuidedLessonSummaries,
  getDrawingGuidedManifest,
} from './drawingGuidedStore';

describe('drawingGuidedStore', () => {
  it('loads the local manifest and lesson summaries', () => {
    const manifest = getDrawingGuidedManifest();
    const lessons = getDrawingGuidedLessonSummaries();

    expect(manifest.category).toBe('arts-plastiques');
    expect(manifest.module).toBe('drawing-guided');
    expect(lessons).toHaveLength(2);
    expect(lessons.map((lesson) => lesson.key)).toEqual(['giraffe-beginner', 'elephant-beginner']);
  });

  it('returns a lesson by key with ordered steps', () => {
    const lesson = getDrawingGuidedLessonByKey('giraffe-beginner');

    expect(lesson?.title).toBe('Girafe');
    expect(lesson?.steps).toHaveLength(6);
    expect(lesson?.steps[0]?.index).toBe(1);
    expect(lesson?.steps[5]?.instruction).toContain('taches');
  });

  it('returns null for an unknown lesson key', () => {
    expect(getDrawingGuidedLessonByKey('missing')).toBeNull();
  });
});
