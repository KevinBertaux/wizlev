/* @vitest-environment jsdom */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StudyFlashcardCarousel from './StudyFlashcardCarousel.vue';

const cards = [
  { id: '1', front: 'Je + être', back: 'suis' },
  { id: '2', front: 'Tu + être', back: 'es' },
  { id: '3', front: 'Nous + être', back: 'sommes' },
];

describe('StudyFlashcardCarousel', () => {
  it('renders first card and reveals back on click', async () => {
    const wrapper = mount(StudyFlashcardCarousel, {
      props: { cards },
    });

    expect(wrapper.text()).toContain('Je + être');
    expect(wrapper.text()).not.toContain('suis');

    await wrapper.get('.flashcard').trigger('click');

    expect(wrapper.text()).toContain('suis');
  });

  it('moves to next card with navigation control', async () => {
    const wrapper = mount(StudyFlashcardCarousel, {
      props: { cards },
    });

    await wrapper.get('.carousel-rail-right').trigger('click');
    expect(wrapper.text()).toContain('Tu + être');
  });
});
