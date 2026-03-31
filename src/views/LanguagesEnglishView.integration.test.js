// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import QuizSelectField from '@/components/QuizSelectField.vue';
import LanguagesEnglishView from './LanguagesEnglishView.vue';

const listEnglishOptionsMock = vi.fn();
const getEnglishListMock = vi.fn();
const hydrateRemoteEnglishListsMock = vi.fn();

vi.mock('@/features/languages/englishLists', () => ({
  listEnglishOptions: (...args) => listEnglishOptionsMock(...args),
  getEnglishList: (...args) => getEnglishListMock(...args),
  hydrateRemoteEnglishLists: (...args) => hydrateRemoteEnglishListsMock(...args),
}));

function createDeferred() {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe('LanguagesEnglishView integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    listEnglishOptionsMock.mockReset();
    getEnglishListMock.mockReset();
    hydrateRemoteEnglishListsMock.mockReset();

    listEnglishOptionsMock.mockReturnValue([
      { key: 'fruits', label: 'Fruits', wordCount: 2 },
    ]);
    getEnglishListMock.mockImplementation((key) =>
      key === 'fruits'
        ? {
            name: 'Fruits',
            description: 'Liste locale immediate',
            words: [
              { english: 'Apple', french: 'Pomme' },
              { english: 'Pear', french: 'Poire' },
            ],
          }
        : null
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the list selector immediately without a blocking remote loader', async () => {
    const deferred = createDeferred();
    hydrateRemoteEnglishListsMock.mockReturnValue(deferred.promise);

    const wrapper = mount(LanguagesEnglishView);
    await Promise.resolve();

    expect(wrapper.find('#englishListSelect').exists()).toBe(true);
    expect(wrapper.getComponent(QuizSelectField).props('label')).toBe('Choisir une liste : 1 liste');
    expect(wrapper.find('.remote-loading-state').exists()).toBe(false);
    expect(wrapper.find('.background-sync-hint').exists()).toBe(false);

    deferred.resolve({ enabled: true, loaded: 0, updated: 0, skipped: 1 });
    await flushPromises();
    wrapper.unmount();
  });

  it('shows a light sync hint only after select interaction while remote sync is still pending', async () => {
    const deferred = createDeferred();
    hydrateRemoteEnglishListsMock.mockReturnValue(deferred.promise);

    const wrapper = mount(LanguagesEnglishView);
    await Promise.resolve();

    await wrapper.get('#englishListSelect').trigger('pointerdown');
    await flushPromises();

    expect(wrapper.get('.background-sync-hint').text()).toContain(
      'Les listes se mettent encore à jour en arriere-plan'
    );

    deferred.resolve({ enabled: true, loaded: 1, updated: 1, skipped: 0 });
    await flushPromises();

    expect(wrapper.find('.background-sync-hint').exists()).toBe(false);
    wrapper.unmount();
  });
});

