// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MathMultiplicationsView from './MathMultiplicationsView.vue';
import QuizTableSelector from '@/components/QuizTableSelector.vue';

function parseQuestion(text) {
  const match = text.match(/(\d+)\s*×\s*(\d+)/);
  if (!match) {
    return null;
  }
  return {
    a: Number.parseInt(match[1], 10),
    b: Number.parseInt(match[2], 10),
  };
}

describe('MathMultiplicationsView integration', () => {
  it('starts from empty state, validates a correct answer, then auto-loads next question', async () => {
    vi.useFakeTimers();

    const wrapper = mount(MathMultiplicationsView, {
      attachTo: document.body,
    });

    expect(wrapper.text()).toContain('Choisir les tables pour commencer.');

    const selector = wrapper.getComponent(QuizTableSelector);
    selector.vm.$emit('update:modelValue', [2]);
    await flushPromises();

    const questionNode = wrapper.find('.question');
    expect(questionNode.exists()).toBe(true);

    const parsed = parseQuestion(questionNode.text());
    expect(parsed).not.toBeNull();
    const correctAnswer = String(parsed.a * parsed.b);

    const answerInput = wrapper.get('.answer-input');
    await answerInput.setValue(correctAnswer);
    await wrapper.get('.mp-btn-primary').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Bonne réponse.');
    expect(wrapper.text()).toContain('Score : 1 / 1');

    const firstQuestionText = questionNode.text();
    vi.advanceTimersByTime(2100);
    await flushPromises();

    expect(wrapper.find('.question').text()).not.toBe(firstQuestionText);

    wrapper.unmount();
    vi.useRealTimers();
  });
});
