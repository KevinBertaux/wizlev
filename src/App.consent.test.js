// @vitest-environment jsdom
import { reactive, nextTick } from 'vue';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';

const route = reactive({
  path: '/',
  fullPath: '/',
});

const { initMock, initCmpRuntimeMock, initAdsRuntimeMock, isCmpManagedConsentEnabledMock, syncAdsConsentMock } =
  vi.hoisted(() => ({
  initMock: vi.fn(),
  initCmpRuntimeMock: vi.fn(),
  initAdsRuntimeMock: vi.fn(),
  isCmpManagedConsentEnabledMock: vi.fn(() => false),
  syncAdsConsentMock: vi.fn(),
  }));

const selections = reactive({
  necessary: true,
  analytics: false,
  ads: false,
});

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    useRoute: () => route,
  };
});

vi.mock('@/features/consent/useConsentStore', () => ({
  useConsentStore: () => ({
    init: initMock,
    selections,
  }),
}));

vi.mock('@/features/ads/adsRuntime', () => ({
  initAdsRuntime: initAdsRuntimeMock,
  syncAdsConsent: syncAdsConsentMock,
}));

vi.mock('@/features/cmp/cmpRuntime', () => ({
  initCmpRuntime: initCmpRuntimeMock,
}));

vi.mock('@/features/cmp/cmpConfig', () => ({
  isCmpManagedConsentEnabled: () => isCmpManagedConsentEnabledMock(),
}));

describe('App consent gating', () => {
  beforeEach(() => {
    route.path = '/';
    route.fullPath = '/';
    initMock.mockClear();
    initCmpRuntimeMock.mockClear();
    initAdsRuntimeMock.mockClear();
    isCmpManagedConsentEnabledMock.mockReset();
    isCmpManagedConsentEnabledMock.mockReturnValue(false);
    syncAdsConsentMock.mockClear();
    selections.necessary = true;
    selections.analytics = false;
    selections.ads = false;
  });

  it('initializes consent and renders consent UI on public routes', () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
          ConsentBanner: true,
          ConsentPreferencesPanel: true,
          StudyAdsShell: { name: 'StudyAdsShell', template: '<div data-test="study-ads-shell"><slot /></div>' },
        },
      },
    });

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(initCmpRuntimeMock).toHaveBeenCalledTimes(1);
    expect(initAdsRuntimeMock).toHaveBeenCalledWith({ managedConsent: false });
    expect(syncAdsConsentMock).toHaveBeenCalledWith(selections);
    expect(wrapper.find('[data-test="study-ads-shell"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Informations');
    expect(wrapper.find('footer').classes()).toContain('site-footer--study-ads');
    expect(wrapper.findComponent({ name: 'ConsentBanner' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ConsentPreferencesPanel' }).exists()).toBe(true);
  });

  it('hides consent UI and does not initialize consent on studio ops routes', () => {
    route.path = '/-/studio-ops/panel';
    route.fullPath = '/-/studio-ops/panel';

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
          ConsentBanner: true,
          ConsentPreferencesPanel: true,
          StudyAdsShell: { name: 'StudyAdsShell', template: '<div data-test="study-ads-shell"><slot /></div>' },
        },
      },
    });

    expect(initMock).not.toHaveBeenCalled();
    expect(initCmpRuntimeMock).not.toHaveBeenCalled();
    expect(initAdsRuntimeMock).not.toHaveBeenCalled();
    expect(syncAdsConsentMock).not.toHaveBeenCalled();
    expect(wrapper.find('[data-test="study-ads-shell"]').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'ConsentBanner' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'ConsentPreferencesPanel' }).exists()).toBe(false);
  });

  it('initializes consent without ads when navigating from studio ops to a legal route', async () => {
    route.path = '/-/studio-ops/panel';
    route.fullPath = '/-/studio-ops/panel';

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
          ConsentBanner: true,
          ConsentPreferencesPanel: true,
          StudyAdsShell: { name: 'StudyAdsShell', template: '<div data-test="study-ads-shell"><slot /></div>' },
        },
      },
    });

    initMock.mockClear();
    initCmpRuntimeMock.mockClear();
    initAdsRuntimeMock.mockClear();
    syncAdsConsentMock.mockClear();
    route.path = '/legal/cookie-policy';
    route.fullPath = '/legal/cookie-policy';
    await nextTick();

    expect(initMock).toHaveBeenCalled();
    expect(initCmpRuntimeMock).toHaveBeenCalled();
    expect(initAdsRuntimeMock).not.toHaveBeenCalled();
    expect(syncAdsConsentMock).not.toHaveBeenCalled();
    expect(wrapper.find('[data-test="study-ads-shell"]').exists()).toBe(false);
    expect(wrapper.find('footer').classes()).not.toContain('site-footer--study-ads');
    expect(wrapper.findComponent({ name: 'ConsentBanner' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ConsentPreferencesPanel' }).exists()).toBe(true);
  });

  it('initializes ads runtime when navigating from legal to a study route', async () => {
    route.path = '/legal/cookie-policy';
    route.fullPath = '/legal/cookie-policy';

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
          ConsentBanner: true,
          ConsentPreferencesPanel: true,
          StudyAdsShell: { name: 'StudyAdsShell', template: '<div data-test="study-ads-shell"><slot /></div>' },
        },
      },
    });

    initMock.mockClear();
    initCmpRuntimeMock.mockClear();
    initAdsRuntimeMock.mockClear();
    syncAdsConsentMock.mockClear();
    route.path = '/math';
    route.fullPath = '/math';
    await nextTick();

    expect(initMock).not.toHaveBeenCalled();
    expect(initCmpRuntimeMock).not.toHaveBeenCalled();
    expect(initAdsRuntimeMock).toHaveBeenCalledWith({ managedConsent: false });
    expect(syncAdsConsentMock).toHaveBeenCalledWith(selections);
    expect(wrapper.find('[data-test="study-ads-shell"]').exists()).toBe(true);
    expect(wrapper.find('footer').classes()).toContain('site-footer--study-ads');
  });

  it('hides the local consent UI and skips local consent store init when CMP managed consent is enabled', () => {
    isCmpManagedConsentEnabledMock.mockReturnValue(true);

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
          ConsentBanner: true,
          ConsentPreferencesPanel: true,
          StudyAdsShell: { name: 'StudyAdsShell', template: '<div data-test="study-ads-shell"><slot /></div>' },
        },
      },
    });

    expect(initCmpRuntimeMock).toHaveBeenCalledTimes(1);
    expect(initMock).not.toHaveBeenCalled();
    expect(initAdsRuntimeMock).toHaveBeenCalledWith({ managedConsent: true });
    expect(syncAdsConsentMock).not.toHaveBeenCalled();
    expect(wrapper.findComponent({ name: 'ConsentBanner' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'ConsentPreferencesPanel' }).exists()).toBe(false);
  });

  it('initializes the managed ads runtime on a public legal route when CMP managed consent is enabled', () => {
    route.path = '/legal/cookie-policy';
    route.fullPath = '/legal/cookie-policy';
    isCmpManagedConsentEnabledMock.mockReturnValue(true);

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: true,
          ConsentBanner: true,
          ConsentPreferencesPanel: true,
          StudyAdsShell: { name: 'StudyAdsShell', template: '<div data-test="study-ads-shell"><slot /></div>' },
        },
      },
    });

    expect(initCmpRuntimeMock).toHaveBeenCalledTimes(1);
    expect(initMock).not.toHaveBeenCalled();
    expect(initAdsRuntimeMock).toHaveBeenCalledWith({ managedConsent: true });
    expect(syncAdsConsentMock).not.toHaveBeenCalled();
    expect(wrapper.find('[data-test="study-ads-shell"]').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'ConsentBanner' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'ConsentPreferencesPanel' }).exists()).toBe(false);
  });
});
