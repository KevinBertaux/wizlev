// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminStatusBanner from './AdminStatusBanner.vue';

describe('AdminStatusBanner', () => {
  it('renders nothing when message is empty', () => {
    const wrapper = mount(AdminStatusBanner, {
      props: {
        message: '',
      },
    });

    expect(wrapper.html()).toBe('<!--v-if-->');
  });

  it('maps tones to semantic classes', () => {
    const success = mount(AdminStatusBanner, {
      props: {
        message: 'OK',
        tone: 'success',
      },
    });
    expect(success.find('.admin-status-success').exists()).toBe(true);

    const warning = mount(AdminStatusBanner, {
      props: {
        message: 'Attention',
        tone: 'warning',
      },
    });
    expect(warning.find('.admin-status-warning').exists()).toBe(true);

    const error = mount(AdminStatusBanner, {
      props: {
        message: 'Erreur',
        tone: 'error',
      },
    });
    expect(error.find('.admin-status-error').exists()).toBe(true);

    const info = mount(AdminStatusBanner, {
      props: {
        message: 'Info',
        tone: 'anything',
      },
    });
    expect(info.find('.admin-status-info').exists()).toBe(true);
  });
});
