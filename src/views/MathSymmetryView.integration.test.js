// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MathSymmetryView from './MathSymmetryView.vue';

describe('MathSymmetryView integration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('selects an option, verifies, then moves to next question on Enter', async () => {
    vi.stubEnv('VITE_REMOTE_CONTENT_BASE_URL', '');
    vi.stubEnv('VITE_SYMMETRY_REMOTE_BASE_URL', '');
    const wrapper = mount(MathSymmetryView, {
      attachTo: document.body,
    });
    await flushPromises();

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
