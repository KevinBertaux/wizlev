// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LegalCookiesView from './LegalCookiesView.vue';

const openPanelMock = vi.fn();
const openCmpPrivacyOptionsMock = vi.fn(() => false);
const isCmpManagedConsentEnabledMock = vi.fn(() => false);

vi.mock('@/features/consent/useConsentStore', () => ({
  useConsentStore: () => ({
    openPanel: openPanelMock,
  }),
}));

vi.mock('@/features/cmp/cmpRuntime', () => ({
  openCmpPrivacyOptions: () => openCmpPrivacyOptionsMock(),
}));

vi.mock('@/features/cmp/cmpConfig', () => ({
  isCmpManagedConsentEnabled: () => isCmpManagedConsentEnabledMock(),
}));

describe('LegalCookiesView', () => {
  beforeEach(() => {
    openPanelMock.mockClear();
    openCmpPrivacyOptionsMock.mockReset();
    openCmpPrivacyOptionsMock.mockReturnValue(false);
    isCmpManagedConsentEnabledMock.mockReset();
    isCmpManagedConsentEnabledMock.mockReturnValue(false);
  });

  it('opens the consent manager from the dedicated button', async () => {
    const wrapper = mount(LegalCookiesView, {
      global: {
        stubs: {
          LegalPageLayout: {
            template: '<section><slot /></section>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Gérer mes cookies');

    await wrapper.get('button').trigger('click');

    expect(openPanelMock).toHaveBeenCalledTimes(1);
  });

  it('delegates to the CMP privacy manager when available', async () => {
    openCmpPrivacyOptionsMock.mockReturnValue(true);

    const wrapper = mount(LegalCookiesView, {
      global: {
        stubs: {
          LegalPageLayout: {
            template: '<section><slot /></section>',
          },
        },
      },
    });

    await wrapper.get('button').trigger('click');

    expect(openCmpPrivacyOptionsMock).toHaveBeenCalledTimes(1);
    expect(openPanelMock).not.toHaveBeenCalled();
  });

  it('does not reopen the local panel when CMP managed consent is enabled', async () => {
    isCmpManagedConsentEnabledMock.mockReturnValue(true);

    const wrapper = mount(LegalCookiesView, {
      global: {
        stubs: {
          LegalPageLayout: {
            template: '<section><slot /></section>',
          },
        },
      },
    });

    await wrapper.get('button').trigger('click');

    expect(openCmpPrivacyOptionsMock).toHaveBeenCalledTimes(1);
    expect(openPanelMock).not.toHaveBeenCalled();
  });
});
