// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import QuizTableSelector from './QuizTableSelector.vue';

function findButton(wrapper, label) {
  return wrapper.findAll('button').find((button) => button.text() === String(label));
}

describe('QuizTableSelector', () => {
  it('normalizes values and selected state', () => {
    const wrapper = mount(QuizTableSelector, {
      props: {
        values: [0, 1, '2', 2, 'x', 3],
        modelValue: ['2', 0, 99, 0],
      },
    });

    const tableButtons = wrapper.findAll('.table-cell').slice(0, 4);
    expect(tableButtons).toHaveLength(4);

    expect(findButton(wrapper, '0').classes()).toContain('is-selected');
    expect(findButton(wrapper, '2').classes()).toContain('is-selected');
    expect(findButton(wrapper, '1').classes()).not.toContain('is-selected');
  });

  it('toggles selected values and emits normalized sorted selection', async () => {
    const wrapper = mount(QuizTableSelector, {
      props: {
        values: [0, 1, 2, 3],
        modelValue: [2],
      },
    });

    await findButton(wrapper, '1').trigger('click');
    await findButton(wrapper, '2').trigger('click');

    const events = wrapper.emitted('update:modelValue');
    expect(events?.[0]).toEqual([[1, 2]]);
    expect(events?.[1]).toEqual([[]]);
  });

  it('applies quick presets', async () => {
    const wrapper = mount(QuizTableSelector, {
      props: {
        values: [0, 1, 2, 3, 4, 5],
        modelValue: [],
      },
    });

    await findButton(wrapper, 'Tout').trigger('click');
    await findButton(wrapper, 'Pairs').trigger('click');
    await findButton(wrapper, 'Impairs').trigger('click');
    await findButton(wrapper, 'Aucun').trigger('click');

    const events = wrapper.emitted('update:modelValue');
    expect(events?.[0]).toEqual([[0, 1, 2, 3, 4, 5]]);
    expect(events?.[1]).toEqual([[0, 2, 4]]);
    expect(events?.[2]).toEqual([[1, 3, 5]]);
    expect(events?.[3]).toEqual([[]]);
  });
});
