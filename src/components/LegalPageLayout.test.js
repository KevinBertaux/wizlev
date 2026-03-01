// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import LegalPageLayout from './LegalPageLayout.vue';

describe('LegalPageLayout', () => {
  it('renders title, update date and slot content', () => {
    const wrapper = mount(LegalPageLayout, {
      props: {
        title: 'Mentions légales',
        updatedAt: '1 mars 2026',
      },
      slots: {
        default: '<p id="slot-content">Contenu légal</p>',
      },
    });

    expect(wrapper.get('h1').text()).toBe('Mentions légales');
    expect(wrapper.text()).toContain('Dernière mise à jour : 1 mars 2026');
    expect(wrapper.get('#slot-content').text()).toBe('Contenu légal');
  });
});
