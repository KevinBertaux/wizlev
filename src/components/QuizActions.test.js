// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import QuizActions from './QuizActions.vue';

describe('QuizActions', () => {
  it('renders custom labels and emits events', async () => {
    const wrapper = mount(QuizActions, {
      props: {
        canCheck: true,
        checkLabel: 'Valider',
        nextLabel: 'Suivante',
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].text()).toBe('Valider');
    expect(buttons[1].text()).toBe('Suivante');

    await buttons[0].trigger('click');
    await buttons[1].trigger('click');

    expect(wrapper.emitted('check')).toHaveLength(1);
    expect(wrapper.emitted('next')).toHaveLength(1);
  });

  it('disables check button when canCheck=false', async () => {
    const wrapper = mount(QuizActions, {
      props: { canCheck: false },
    });

    const [checkButton, nextButton] = wrapper.findAll('button');
    expect(checkButton.attributes('disabled')).toBeDefined();
    expect(nextButton.attributes('disabled')).toBeUndefined();
  });
});
