// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StudyAdsShell from './StudyAdsShell.vue';

describe('StudyAdsShell', () => {
  it('renders the three lot-1 study slots around its content', () => {
    const wrapper = mount(StudyAdsShell, {
      global: {
        stubs: {
          AdSlotLive: {
            props: ['slotId'],
            template: '<div class="slot-stub">{{ slotId }}</div>',
          },
        },
      },
      slots: {
        default: '<div data-test="study-content">Contenu du cours</div>',
      },
    });

    expect(wrapper.text()).toContain('study-rail-right');
    expect(wrapper.text()).toContain('study-top-banner');
    expect(wrapper.text()).toContain('study-bottom-banner');
    expect(wrapper.find('[data-test="study-content"]').exists()).toBe(true);
  });
});
