// @vitest-environment jsdom
import { reactive } from 'vue';
import { nextTick } from 'vue';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';
import { ROUTE_NAMES } from '@/router/routes';

const route = reactive({
  name: ROUTE_NAMES.HOME,
  path: '/fr',
  fullPath: '/fr',
});
const push = vi.fn();

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    useRoute: () => route,
    useRouter: () => ({ push }),
  };
});

describe('App product shell', () => {
  beforeEach(() => {
    route.name = ROUTE_NAMES.HOME;
    route.path = '/fr';
    route.fullPath = '/fr';
    push.mockReset();
    vi.useRealTimers();
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 0,
    });
    window.matchMedia = vi.fn(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
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
    route.name = ROUTE_NAMES.STUDIO_OPS_PANEL;
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

  it('toggles the mobile navigation and resets open groups after route changes', async () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
        },
      },
    });

    await wrapper.get('button.burger').trigger('click');
    expect(wrapper.get('#main-nav').classes()).toContain('open');

    const triggers = wrapper.findAll('button.nav-trigger');
    await triggers[0].trigger('click');
    expect(wrapper.findAll('.nav-group')[0].classes()).toContain('open');

    route.name = ROUTE_NAMES.LANGUAGES_ENGLISH;
    route.path = '/fr/languages/english';
    route.fullPath = '/fr/languages/english';
    await nextTick();

    expect(wrapper.get('#main-nav').classes()).not.toContain('open');
    expect(wrapper.findAll('.nav-group')[0].classes()).not.toContain('open');
  });

  it('supports desktop hover navigation timers, direct hub navigation and compact header updates', async () => {
    vi.useFakeTimers();
    window.matchMedia = vi.fn((query) => ({
      matches: query === '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
        },
      },
    });

    const firstGroup = wrapper.findAll('.nav-group')[0];
    await firstGroup.trigger('mouseenter');
    await vi.advanceTimersByTimeAsync(300);
    expect(firstGroup.classes()).toContain('open');

    await firstGroup.trigger('mouseleave');
    await vi.advanceTimersByTimeAsync(180);
    expect(firstGroup.classes()).not.toContain('open');

    await wrapper.findAll('button.nav-trigger')[0].trigger('click');
    expect(push).toHaveBeenCalledWith({ name: ROUTE_NAMES.MATH_HUB });

    window.scrollY = 60;
    window.dispatchEvent(new Event('scroll'));
    await nextTick();
    expect(wrapper.get('header.topbar').classes()).toContain('topbar--compact');
  });
});
