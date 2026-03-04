// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import QuizFeedbackBanner from './QuizFeedbackBanner.vue';

describe('QuizFeedbackBanner', () => {
  it('renders nothing when main is empty', () => {
    const wrapper = mount(QuizFeedbackBanner, {
      props: {
        type: 'correct',
        main: '',
      },
    });

    expect(wrapper.html()).toBe('<!--v-if-->');
  });

  it('renders success and error classes with optional extra text', () => {
    const success = mount(QuizFeedbackBanner, {
      props: {
        type: 'correct',
        main: 'Bonne réponse.',
      },
    });
    expect(success.find('.mp-feedback-success').exists()).toBe(true);

    const error = mount(QuizFeedbackBanner, {
      props: {
        type: 'incorrect',
        main: 'Mauvaise réponse.',
        extra: 'Bonne réponse: 12.',
      },
    });

    expect(error.find('.mp-feedback-error').exists()).toBe(true);
    expect(error.find('.feedback-extra').text()).toContain('Bonne réponse: 12.');
  });

  it('supports warning and info tones', () => {
    const warning = mount(QuizFeedbackBanner, {
      props: {
        type: 'warning',
        main: 'Attention.',
      },
    });
    expect(warning.find('.mp-feedback-warning').exists()).toBe(true);

    const info = mount(QuizFeedbackBanner, {
      props: {
        type: 'info',
        main: 'Information.',
      },
    });
    expect(info.find('.mp-feedback-info').exists()).toBe(true);
  });
});
