// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import LanguagesFrenchHubView from './LanguagesFrenchHubView.vue';
import { getFrenchInflectionModule, getFrenchVerb } from '@/features/languages/frenchConjugations';

const replaceMock = vi.fn();
const routeState = {
  query: {},
  path: '/languages/french',
  name: 'languages-french',
};

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    replace: replaceMock,
  }),
  onBeforeRouteLeave: vi.fn(),
}));

function pronounKeyFromPrompt(promptText) {
  const pronounLabel = String(promptText || '').split('+')[0]?.trim() || '';
  const mapping = {
    Je: 'je',
    Tu: 'tu',
    Il: 'il',
    Elle: 'elle',
    On: 'on',
    Nous: 'nous',
    Vous: 'vous',
    Ils: 'ils',
    Elles: 'elles',
  };

  return mapping[pronounLabel] || '';
}

describe('LanguagesFrenchHubView integration', () => {
  beforeEach(() => {
    routeState.query = {};
    replaceMock.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows grouped flashcards with 6 cards in the workspace', async () => {
    const wrapper = mount(LanguagesFrenchHubView, {
      attachTo: document.body,
    });

    await wrapper.get('#frenchHubVerbSelect').setValue('aimer');
    await wrapper.get('#frenchHubTenseSelect').setValue('present');
    await flushPromises();

    await wrapper.findAll('.french-hub__mode-card')[0].trigger('click');
    await flushPromises();

    expect(wrapper.get('.flashcard-count').text()).toBe('1/6');

    wrapper.unmount();
  });

  it('updates QCM score chips in real time after a correct answer', async () => {
    vi.useFakeTimers();

    const wrapper = mount(LanguagesFrenchHubView, {
      attachTo: document.body,
    });

    const source = getFrenchInflectionModule();

    await wrapper.get('#frenchHubVerbSelect').setValue('aimer');
    await wrapper.get('#frenchHubTenseSelect').setValue('present');
    await flushPromises();

    const modeCards = wrapper.findAll('.french-hub__mode-card');
    const qcmCard = modeCards[1];
    expect(qcmCard.text()).toContain('Meilleur score : 0');

    await qcmCard.trigger('click');
    await flushPromises();

    const promptText = wrapper.get('.prompt-box h2').text();
    const pronounKey = pronounKeyFromPrompt(promptText);
    const correctAnswer = getFrenchVerb('aimer', source, 'indicatif', 'present')?.forms?.[pronounKey];

    expect(pronounKey).toBeTruthy();
    expect(correctAnswer).toBeTruthy();

    const optionButtons = wrapper.findAll('.french-qcm-panel__option');
    const correctButton = optionButtons.find((option) => option.text().includes(correctAnswer));

    expect(correctButton).toBeTruthy();

    await correctButton.trigger('click');
    await wrapper.get('.mp-btn-primary').trigger('click');
    await flushPromises();

    const updatedQcmCard = wrapper.findAll('.french-hub__mode-card')[1];
    expect(updatedQcmCard.text()).toContain('Meilleur score : 1');
    expect(updatedQcmCard.text()).toContain('Meilleure série : 1');

    vi.runOnlyPendingTimers();
    wrapper.unmount();
  });
});
