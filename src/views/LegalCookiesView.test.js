// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LegalCookiesView from './LegalCookiesView.vue';

describe('LegalCookiesView', () => {
  it('documents the cookie policy without exposing an interactive manager in the product line', () => {
    const wrapper = mount(LegalCookiesView, {
      global: {
        stubs: {
          LegalPageLayout: {
            template: '<section><slot /></section>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Gestion des choix');
    expect(wrapper.text()).toContain("ne propose pas encore de gestionnaire interactif public");
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
