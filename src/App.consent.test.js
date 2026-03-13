// @vitest-environment jsdom
import { reactive } from 'vue';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';

const route = reactive({
  path: '/',
  fullPath: '/',
});

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    useRoute: () => route,
  };
});

describe('App product shell', () => {
  beforeEach(() => {
    route.path = '/';
    route.fullPath = '/';
  });

  it('renders a plain public shell without consent or study ads overlays', () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Informations');
    expect(wrapper.find('footer').classes()).not.toContain('site-footer--study-ads');
    expect(wrapper.findComponent({ name: 'ConsentBanner' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'ConsentPreferencesPanel' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'StudyAdsShell' }).exists()).toBe(false);
  });

  it('keeps the admin container class on internal panel routes', () => {
    route.path = '/-/studio-ops/panel';
    route.fullPath = '/-/studio-ops/panel';

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
        },
      },
    });

    expect(wrapper.find('main').classes()).toContain('admin-shell-container');
  });
});
