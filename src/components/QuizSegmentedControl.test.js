// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import QuizSegmentedControl from './QuizSegmentedControl.vue';

describe('QuizSegmentedControl', () => {
  it('renders options and active state from modelValue', () => {
    const wrapper = mount(QuizSegmentedControl, {
      props: {
        modelValue: 'standard',
        label: 'Difficulté',
        options: [
          { value: 'discovery', label: 'Découverte' },
          { value: 'standard', label: 'Standard' },
        ],
      },
    });

    const buttons = wrapper.findAll('.segment-btn');
    expect(buttons).toHaveLength(2);
    expect(buttons[1].classes()).toContain('is-active');
    expect(wrapper.find('[role="radiogroup"]').attributes('aria-label')).toBe('Difficulté');
  });

  it('emits update:modelValue when selecting another segment', async () => {
    const wrapper = mount(QuizSegmentedControl, {
      props: {
        modelValue: 'ordered',
        ariaLabel: 'Ordre',
        options: [
          { value: 'ordered', label: "Dans l'ordre" },
          { value: 'mixed', label: 'Tout mélanger' },
        ],
      },
    });

    await wrapper.findAll('.segment-btn')[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['mixed']]);
    expect(wrapper.find('[role="radiogroup"]').attributes('aria-label')).toBe('Ordre');
  });
});
