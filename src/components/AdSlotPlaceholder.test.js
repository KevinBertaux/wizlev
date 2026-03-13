// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AdSlotPlaceholder from './AdSlotPlaceholder.vue';

const adsSlotsMocks = vi.hoisted(() => ({
  getAdSlotByIdMock: vi.fn(),
  isAdSlotVisibleMock: vi.fn(),
}));

vi.mock('@/features/ads/adsSlots', () => ({
  getAdSlotById: (...args) => adsSlotsMocks.getAdSlotByIdMock(...args),
  isAdSlotVisible: (...args) => adsSlotsMocks.isAdSlotVisibleMock(...args),
}));

describe('AdSlotPlaceholder', () => {
  it('renders the reserved ad slot frame for a known visible slot', () => {
    adsSlotsMocks.getAdSlotByIdMock.mockReturnValue({
      id: 'study-rail-right',
      label: "Rail droit d'étude",
      format: 'vertical-rail',
      enabled: false,
    });
    adsSlotsMocks.isAdSlotVisibleMock.mockReturnValue(true);

    const wrapper = mount(AdSlotPlaceholder, {
      props: {
        slotId: 'study-rail-right',
      },
    });

    expect(wrapper.text()).toContain('Annonce réservée');
    expect(wrapper.text()).toContain("Rail droit d'étude");
    expect(wrapper.text()).toContain('160 x 600');
  });

  it('does not render anything for an unknown slot', () => {
    adsSlotsMocks.getAdSlotByIdMock.mockReturnValue(null);
    adsSlotsMocks.isAdSlotVisibleMock.mockReturnValue(false);

    const wrapper = mount(AdSlotPlaceholder, {
      props: {
        slotId: 'unknown-slot',
      },
    });

    expect(wrapper.find('aside').exists()).toBe(false);
  });
});
