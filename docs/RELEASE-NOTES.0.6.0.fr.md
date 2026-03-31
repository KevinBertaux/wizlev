# Release Notes - 0.6.0

Date: 25 mars 2026

## Résumé

Cette release `0.6.0` consolide la base produit autour du Français, du chargement distant R2 et d'une QA responsive plus complète, sans changer l'architecture statique générale du site.

## Principales évolutions

- Langues :
  - workspace Français complet de conjugaison avec tableau, flashcards, QCM et réponse libre ;
  - élision française gérée (`j'`, base `h muet / h aspiré`) ;
  - TTS branché sur les flashcards Français ;
  - chargement Anglais en tâche de fond, avec fallback local canon et manifests R2 versionnés ;
  - manifest R2 Français avec `1 verbe = 1 JSON`, prêt pour enrichir le corpus sans redéployer.
- Mathématiques :
  - banque Symétrie V2 pilotée via R2 et reviewer éditorial ;
  - parcours Multiplications et Symétrie conservés dans le périmètre QA responsive.
- UI / UX :
  - réduction des miss-clic sur les actions de quiz (`Vérifier` / `Continuer`) ;
  - header compact au scroll et en responsive ;
  - navigation principale réalignée sur l'état réel du site.
- Qualité :
  - matrice Playwright responsive étendue sur app shell, Anglais, Français et Mathématiques.
- Légal / documentation :
  - pages légales alignées sur `wizlev.com` ;
  - documentation et références de version mises à jour pour la sortie `0.6.0`.

## Notes techniques

- Le site reste déployé en statique (`Vue 3 + Vite + Netlify`).
- Le contenu distant continue à s'appuyer sur Cloudflare R2 avec fallback local canon pour les parcours critiques.
- Le panneau interne reste front-only ; son durcissement plus poussé est sorti du scope `0.6` et reste au backlog.
