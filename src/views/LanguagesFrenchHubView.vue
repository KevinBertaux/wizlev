<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import QuizSelectField from '@/components/QuizSelectField.vue';
import { listFrenchVerbOptions, getFrenchVerb } from '@/features/languages/frenchConjugations';

const router = useRouter();
const verbOptions = listFrenchVerbOptions();
const selectedVerb = ref(verbOptions[0]?.value || '');

const activeVerb = computed(() => getFrenchVerb(selectedVerb.value));

function openTable() {
  if (!selectedVerb.value) {
    return;
  }

  router.push({
    name: 'languages-french-table',
    params: { verbKey: selectedVerb.value },
  });
}
</script>

<template>
  <section class="page-block french-hub">
    <div class="section-block">
      <h1>🇫🇷 Français</h1>
      <p class="hub-intro">
        Révise la conjugaison française avec tableaux, flashcards et exercices progressifs.
      </p>
    </div>

    <div class="page-block section-block">
      <QuizSelectField
        v-model="selectedVerb"
        select-id="frenchHubVerbSelect"
        label="Choisir un verbe :"
        :options="verbOptions"
      />

      <p v-if="activeVerb" class="french-hub__selection">
        Verbe actif : <strong>{{ activeVerb.label }}</strong>
      </p>
    </div>

    <div class="cards-grid grid grid-cols-1 gap-4 lg:grid-cols-2">
      <button class="home-card french-hub__card french-hub__card--action" type="button" @click="openTable">
        <h2>📖 Voir le tableau</h2>
        <p>Consulte la fiche de référence du verbe avec les 6 lignes du présent.</p>
      </button>

      <article class="home-card french-hub__card french-hub__card--locked" aria-disabled="true">
        <h2>🃏 Flashcards</h2>
        <p>Mémorisation pronom par pronom. Lot suivant du module.</p>
      </article>

      <article class="home-card french-hub__card french-hub__card--locked" aria-disabled="true">
        <h2>✅ QCM</h2>
        <p>Reconnaissance rapide avec réponses 1, 2, 3, 4 au clavier. Lot suivant.</p>
      </article>

      <article class="home-card french-hub__card french-hub__card--locked" aria-disabled="true">
        <h2>⌨️ Saisie</h2>
        <p>Rappel actif avec champ texte, score et série. Lot suivant.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.french-hub {
  display: grid;
  gap: 18px;
}

.french-hub__selection {
  margin: 14px 0 0;
  color: #1f3550;
  font-weight: 700;
}

.french-hub__card {
  text-align: left;
}

.french-hub__card--action {
  width: 100%;
  border: 0;
  cursor: pointer;
}

.french-hub__card--locked {
  opacity: 0.75;
  border-style: dashed;
}
</style>
