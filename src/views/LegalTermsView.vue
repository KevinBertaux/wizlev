<script setup>
import LegalPageLayout from '@/components/LegalPageLayout.vue';
</script>

<template>
  <LegalPageLayout title="Conditions générales d'utilisation (CGU)" updated-at="13 mars 2026">
    <h2>1. Objet</h2>
    <p>
      Les présentes conditions générales d'utilisation définissent les règles d'accès et d'usage du site
      <strong>ManabuPlay</strong>, service éducatif de révision scolaire.
    </p>

    <h2>2. Accès et acceptation</h2>
    <p>
      L'utilisation du site implique l'acceptation pleine et entière des présentes CGU. En cas de désaccord avec ces
      conditions, l'utilisateur est invité à ne pas utiliser le service.
    </p>
    <p>
      Le site est accessible gratuitement, sous réserve de disponibilité technique. L'éditeur peut suspendre, limiter
      ou interrompre tout ou partie du service pour maintenance, mise à jour ou raisons de sécurité.
    </p>

    <h2>3. Règles d'usage</h2>
    <ul>
      <li>Usage autorisé : révision scolaire personnelle, familiale ou pédagogique.</li>
      <li>Usage interdit : détournement technique, tentative d'accès non autorisé, altération du service.</li>
      <li>Usage interdit : reproduction massive ou exploitation commerciale non autorisée des contenus.</li>
    </ul>

    <h2>4. Public mineur</h2>
    <p>
      Le site est destiné à un usage éducatif, y compris par des mineurs. L'utilisation par un mineur doit se faire
      sous la responsabilité et, si nécessaire, la supervision d'un parent ou représentant légal.
    </p>

    <h2>5. Propriété intellectuelle</h2>
    <p>
      Sauf mention contraire, les contenus du site (textes, structure, éléments graphiques, code, ressources
      pédagogiques) restent protégés par les règles de propriété intellectuelle applicables.
    </p>

    <h2>6. Responsabilité</h2>
    <p>
      L'éditeur met en oeuvre des moyens raisonnables pour assurer la qualité et la disponibilité du service, sans
      garantie d'absence d'erreurs, d'interruptions ou d'inexactitudes.
    </p>
    <p>
      Le site constitue une aide pédagogique. Il ne remplace ni l'enseignement scolaire, ni l'accompagnement éducatif,
      ni le jugement des responsables légaux.
    </p>

    <h2>7. Données personnelles et cookies</h2>
    <p>
      Le traitement des données et des traceurs est décrit dans la
      <router-link :to="{ name: 'legal-privacy' }">Politique de confidentialité</router-link>
      et la
      <router-link :to="{ name: 'legal-cookies' }">Politique cookies</router-link>.
    </p>

    <h2>8. Évolution des CGU</h2>
    <p>
      Les présentes CGU peuvent être modifiées à tout moment. La version applicable est celle publiée sur cette page à
      la date de consultation.
    </p>

    <h2>9. Droit applicable et contact</h2>
    <p>Les présentes CGU sont soumises au droit français.</p>
    <p>Pour toute question relative à ces CGU : kevinbertaux+manabuplay [at] gmail [dot] com</p>
  </LegalPageLayout>
</template>
