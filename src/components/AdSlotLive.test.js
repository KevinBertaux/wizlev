// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdSlotLive from './AdSlotLive.vue';

const { getAdSlotByIdMock, resolveAdsProviderConfigMock } = vi.hoisted(() => ({
  getAdSlotByIdMock: vi.fn(),
  resolveAdsProviderConfigMock: vi.fn(),
}));

vi.mock('@/features/ads/adsSlots', () => ({
  getAdSlotById: (...args) => getAdSlotByIdMock(...args),
}));

vi.mock('@/features/ads/adsConfig', () => ({
  resolveAdsProviderConfig: (...args) => resolveAdsProviderConfigMock(...args),
}));

describe('AdSlotLive', () => {
  afterEach(() => {
    delete window.adsbygoogle;
  });

  it('pushes an AdSense slot when the provider and slot are configured', async () => {
    const push = vi.fn();
    window.adsbygoogle = { push };

    getAdSlotByIdMock.mockReturnValue({
      id: 'study-top-banner',
      label: "Bandeau haut d'étude",
      format: 'top-banner',
      adsenseSlotId: '1234567890',
      enabled: true,
    });
    resolveAdsProviderConfigMock.mockReturnValue({
      id: 'adsense',
      enabled: true,
      adsenseClient: 'ca-pub-5688119439559839',
    });

    const wrapper = mount(AdSlotLive, {
      props: {
        slotId: 'study-top-banner',
      },
      global: {
        stubs: {
          AdSlotPlaceholder: true,
        },
      },
    });

    await nextTick();
    await nextTick();

    expect(wrapper.find('ins.adsbygoogle').exists()).toBe(true);
    expect(push).toHaveBeenCalledTimes(1);
  });
});
