<script setup>
import LegalPageLayout from '@/components/LegalPageLayout.vue';
</script>

<template>
  <LegalPageLayout title="Politique de confidentialité" updated-at="20 mars 2026">
    <h2>1. Responsable du traitement</h2>
    <p>
      Le site <strong>ManabuPlay</strong> est exploité par un éditeur non professionnel. Contact vie privée : contact
      [at] manabuplay [dot] fr
    </p>

    <h2>2. Données traitées</h2>
    <p>
      À ce jour, le site ne propose ni compte utilisateur, ni newsletter, ni formulaire de collecte dans les parcours
      standards. Aucune donnée d'identité (nom, prénom, adresse email de l'élève) n'est demandée pour utiliser les
      modules publics.
    </p>

    <h3>2.1 Données stockées localement sur votre appareil</h3>
    <ul>
      <li>Préférences pédagogiques et réglages d'interface mémorisés dans le navigateur</li>
      <li>Progression ou meilleurs scores enregistrés localement selon les modules</li>
      <li>Contenus modifiés localement via le panneau interne (localStorage)</li>
      <li>État de session du panneau interne dans l'onglet courant (sessionStorage)</li>
    </ul>
    <p>Ces données restent sur votre appareil et ne sont pas transmises automatiquement à l'éditeur.</p>

    <h3>2.2 Données techniques d'hébergement</h3>
    <p>
      Lors de l'accès au site, l'hébergeur peut traiter des journaux techniques nécessaires au fonctionnement et à la
      protection du service (par exemple adresse IP, date et heure, requêtes, informations de sécurité).
    </p>

    <h2>3. Finalités et bases légales</h2>
    <ul>
      <li>Fourniture du service éducatif et mémorisation locale des préférences</li>
      <li>Sécurisation technique de la plateforme</li>
      <li>Maintenance et diagnostic de fonctionnement</li>
    </ul>
    <p>
      Les bases légales principales sont l'intérêt légitime pour l'exploitation et la sécurisation du service, ainsi
      que les obligations légales applicables à l'hébergement et à la conservation de certains journaux techniques.
    </p>

    <h2>4. Cookies et traceurs</h2>
    <p>
      Les règles détaillées relatives aux cookies, traceurs et choix utilisateur sont publiées dans la
      <router-link :to="{ name: 'legal-cookies' }">Politique cookies</router-link>.
    </p>
    <p>
      Dans la version produit actuelle, aucun script publicitaire n'est chargé sans consentement préalable.
    </p>

    <h2>5. Destinataires des données</h2>
    <p>
      Les données techniques d'hébergement sont traitées par l'hébergeur Netlify, Inc. Les données stockées localement
      restent accessibles depuis votre navigateur, sur l'appareil utilisé.
    </p>

    <h2>6. Durées de conservation</h2>
    <ul>
      <li>Données locales du navigateur : jusqu'à suppression par l'utilisateur ou réinitialisation locale</li>
      <li>Session du panneau interne : jusqu'à fermeture de l'onglet ou expiration de session</li>
      <li>Journaux techniques d'hébergement : selon la politique de l'hébergeur</li>
    </ul>

    <h2>7. Transferts hors Union européenne</h2>
    <p>
      L'hébergeur étant une société américaine, certains traitements techniques peuvent impliquer des transferts hors
      Union européenne. Ces traitements relèvent des engagements contractuels et mécanismes de conformité de
      l'hébergeur.
    </p>

    <h2>8. Vos droits</h2>
    <p>
      Conformément au RGPD et à la loi Informatique et Libertés, vous disposez notamment des droits d'accès, de
      rectification, d'effacement, de limitation, d'opposition et, selon les cas, de portabilité.
    </p>
    <p>Pour exercer vos droits : contact [at] manabuplay [dot] fr</p>
    <p>
      Vous pouvez également introduire une réclamation auprès de la CNIL :
      <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">cnil.fr</a>
    </p>

    <h2>9. Mineurs</h2>
    <p>
      Le site est conçu pour un usage éducatif, y compris par des mineurs. Aucune collecte directe de données
      personnelles d'élèves n'est recherchée dans les parcours standards.
    </p>
    <p>
      Si un futur traitement devait reposer sur le consentement, les règles applicables aux mineurs en France seraient
      prises en compte, notamment pour les utilisateurs de moins de 15 ans.
    </p>

    <h2>10. Évolution de la politique</h2>
    <p>
      Cette politique peut être mise à jour pour refléter les évolutions du site, de la loi ou des recommandations des
      autorités compétentes.
    </p>
  </LegalPageLayout>
</template>
