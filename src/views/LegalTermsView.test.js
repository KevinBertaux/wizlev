// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LegalTermsView from './LegalTermsView.vue';

describe('LegalTermsView', () => {
  it('keeps the CGU links and educational usage framing', () => {
    const wrapper = mount(LegalTermsView, {
      global: {
        stubs: {
          LegalPageLayout: {
            template: '<section><slot /></section>',
          },
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain("conditions générales d'utilisation");
    expect(wrapper.text()).toContain('usage éducatif');
    expect(wrapper.text()).toContain('Politique de confidentialité');
    expect(wrapper.text()).toContain('Politique cookies');
    expect(wrapper.text()).toContain('contact [at] wizlev [dot] com');
  });
});
