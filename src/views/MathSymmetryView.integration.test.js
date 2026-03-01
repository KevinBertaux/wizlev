// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MathSymmetryView from './MathSymmetryView.vue';

describe('MathSymmetryView integration', () => {
  it('selects an option, verifies, then moves to next question on Enter', async () => {
    const wrapper = mount(MathSymmetryView, {
      attachTo: document.body,
    });

    const prompt = wrapper.get('.prompt-box p');
    const firstPrompt = prompt.text();
    expect(firstPrompt.length).toBeGreaterThan(0);

    const firstOption = wrapper.get('.option-btn');
    await firstOption.trigger('click');
    await wrapper.get('.mp-btn-primary').trigger('click');
    await flushPromises();

    expect(wrapper.find('.mp-feedback').exists()).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await flushPromises();

    expect(wrapper.get('.prompt-box p').text()).not.toBe(firstPrompt);
    wrapper.unmount();
  });
});
