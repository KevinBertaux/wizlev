// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import QuizActions from './QuizActions.vue';

describe('QuizActions', () => {
  it('renders custom labels and emits events', async () => {
    const wrapper = mount(QuizActions, {
      props: {
        state: 'check',
        canCheck: true,
        checkLabel: 'Valider',
        nextLabel: 'Suivante',
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].text()).toBe('Valider');

    await buttons[0].trigger('click');

    expect(wrapper.emitted('check')).toHaveLength(1);
    expect(wrapper.emitted('next')).toBeUndefined();
  });

  it('disables check button when canCheck=false', async () => {
    const wrapper = mount(QuizActions, {
      props: { state: 'check', canCheck: false },
    });

    const [checkButton] = wrapper.findAll('button');
    expect(checkButton.attributes('disabled')).toBeDefined();
  });

  it('renders only the next action in next state', async () => {
    const wrapper = mount(QuizActions, {
      props: {
        state: 'next',
        nextLabel: 'Continuer',
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].text()).toBe('Continuer');

    await buttons[0].trigger('click');
    expect(wrapper.emitted('next')).toHaveLength(1);
  });

  it('renders nothing in none state', () => {
    const wrapper = mount(QuizActions, {
      props: { state: 'none' },
    });

    expect(wrapper.findAll('button')).toHaveLength(0);
  });
});
