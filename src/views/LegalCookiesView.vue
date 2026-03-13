<script setup>
import LegalPageLayout from '@/components/LegalPageLayout.vue';
import { useConsentStore } from '@/features/consent/useConsentStore';

const consentStore = useConsentStore();

function openConsentManager() {
  consentStore.openPanel();
}
</script>

<template>
  <LegalPageLayout title="Politique cookies" updated-at="13 mars 2026">
    <h2>1. Objet</h2>
    <p>
      Cette page explique l'usage des cookies, stockages locaux et technologies similaires sur <strong>ManabuPlay</strong>,
      ainsi que les choix mis à disposition de l'utilisateur.
    </p>

    <h2>2. Stockages strictement nécessaires</h2>
    <p>
      Le site utilise des stockages techniques nécessaires à son fonctionnement ou à la mémorisation de préférences
      locales, par exemple pour les réglages d'interface, certaines progressions pédagogiques ou l'accès au panneau
      interne sur l'appareil en cours.
    </p>
    <p>
      Ces éléments techniques servent au bon fonctionnement du service et ne sont pas activés à des fins publicitaires.
    </p>

    <h2>3. Cookies non essentiels et publicité</h2>
    <p>
      Dans la version produit actuelle, aucun script publicitaire n'est chargé avant consentement. Si des modules de
      monétisation ou de mesure non exemptée sont activés publiquement, un gestionnaire de consentement adapté prendra
      le relais avant tout chargement non essentiel.
    </p>

    <h2 id="manage-cookies">4. Gérer mes cookies</h2>
    <p>
      Le lien « Cookies » du pied de page redirige vers cette page. Utilisez ce bouton pour ouvrir directement le
      gestionnaire disponible dans la version courante du site.
    </p>
    <p>
      <button type="button" class="mp-btn mp-btn-secondary" @click="openConsentManager">Gérer mes cookies</button>
    </p>

    <h2>5. Durée de conservation des choix</h2>
    <p>
      Les choix liés aux cookies et traceurs sont conservés pour une durée limitée, puis redemandés selon les exigences
      applicables et l'évolution du mécanisme de consentement en production.
    </p>

    <h2>6. Contact</h2>
    <p>Pour toute question relative aux cookies et traceurs : kevinbertaux+manabuplay [at] gmail [dot] com</p>
  </LegalPageLayout>
</template>
