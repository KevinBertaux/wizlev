// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LegalNoticeView from './LegalNoticeView.vue';

describe('LegalNoticeView', () => {
  it('exposes the current published version and legal contact details', () => {
    const wrapper = mount(LegalNoticeView, {
      global: {
        stubs: {
          LegalPageLayout: {
            template: '<section><slot /></section>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Version en cours');
    expect(wrapper.text()).toContain('0.6.1');
    expect(wrapper.text()).toContain('contact [at] wizlev [dot] com');
    expect(wrapper.text()).toContain('Netlify, Inc.');
  });
});
