// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import QuizNumericPad from './QuizNumericPad.vue';

function findKeyByLabel(wrapper, label) {
  return wrapper.findAll('button').find((button) => button.text() === label);
}

describe('QuizNumericPad', () => {
  it('emits digit, backspace and enter events', async () => {
    const wrapper = mount(QuizNumericPad);

    await findKeyByLabel(wrapper, '7').trigger('click');
    await findKeyByLabel(wrapper, '⌫').trigger('click');
    await findKeyByLabel(wrapper, '✓').trigger('click');

    expect(wrapper.emitted('digit')).toEqual([['7']]);
    expect(wrapper.emitted('backspace')).toHaveLength(1);
    expect(wrapper.emitted('enter')).toHaveLength(1);
  });

  it('locks digit/backspace when answerLocked=true but keeps enter enabled', async () => {
    const wrapper = mount(QuizNumericPad, {
      props: { answerLocked: true },
    });

    const digit = findKeyByLabel(wrapper, '1');
    const backspace = findKeyByLabel(wrapper, '⌫');
    const enter = findKeyByLabel(wrapper, '✓');

    expect(digit.attributes('disabled')).toBeDefined();
    expect(backspace.attributes('disabled')).toBeDefined();
    expect(enter.attributes('disabled')).toBeUndefined();
  });

  it('disables all keys when disabled=true', () => {
    const wrapper = mount(QuizNumericPad, {
      props: { disabled: true },
    });

    for (const button of wrapper.findAll('button')) {
      expect(button.attributes('disabled')).toBeDefined();
    }
  });
});
