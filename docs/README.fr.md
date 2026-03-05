# ManabuPlay

Application web éducative (SPA Vue 3 + Vite) pour aider les enfants à réviser les mathématiques et le vocabulaire.

[English version](README.en.md)

## Version

- Version en cours: `0.5.0-prep`
- Dernière modification: `3 mars 2026` (fr-FR)

## Fonctionnalités actuelles

### Math (`/math/multiplications`, `/math/symmetry`)
- Multiplications: sélection multi-tables (0-11), modes de difficulté, score/série/meilleure série
- Multiplications: validation clavier (`Entrée`) + pavé numérique desktop/tablette
- Symétrie V1: QCM visuel (axes vertical + horizontal), score/série/meilleure série
- Aucun démarrage implicite: sélection requise avant exercice

### Vocabulaire anglais (`/languages/english`)
- Listes JSON externes avec titre, description et mots
- Dropdown avec compteur dynamique de mots (`xx mots`)
- Aucune liste sélectionnée par défaut
- Flashcards: navigation flèches, clavier et swipe mobile
- TTS anglais: en-US avec alternance normale/lente au clic
- Sens de carte: Anglais -> Français ou Français -> Anglais
- Bouton TTS masqué en mode FR -> EN avant révélation

### Zone interne V1 (accès restreint)
- Édition locale des listes (nom, description, mots)
- Dropdown admin avec compteur dynamique de mots
- Import JSON / export JSON / copie JSON
- Sauvegarde locale en `localStorage`
- Accès via URL interne `/-/studio-ops` (non exposée dans le menu public)

### Données vocabulaire (R2 V1)
- Chargement distant Cloudflare R2 activable via variables d'environnement
- `index.json` (manifest des listes) + fallback local automatique si indisponible
- Objectif: pouvoir mettre à jour des listes sans déploiement applicatif

## Installation locale

### Prérequis
- Node.js LTS (v24+ recommandé)
- npm

### Démarrage
1. `npm install`
2. `npm run dev`
3. Ouvrir l'URL affichée (ex: `http://localhost:5173`)

### Qualité
- Tests unitaires/intégration: `npm test`
- Tests E2E navigateur: `npm run test:e2e`
- Build production: `npm run build`

## Routes SPA

- `/`: Accueil
- `/math`: Hub Math
- `/math/multiplications`: Module Multiplications
- `/math/symmetry`: Module Symétrie
- `/languages`: Hub Langues
- `/languages/english`: Module vocabulaire anglais
- `/-/studio-ops`: Zone interne (login)
- `/-/studio-ops/panel`: Zone interne (panneau)
- `/-/studio-ops/help`: Guide panneau interne (switch FR/EN)
- `/legal/legal-notice`: Mentions légales
- `/legal/terms-of-use`: Conditions générales d'utilisation
- `/legal/privacy-policy`: Politique de confidentialité
- `/legal/cookie-policy`: Politique cookies

## Documentation

- Checklist QA: `docs/QA-CHECKLIST.fr.md`
- Checklist release: `docs/RELEASE-CHECKLIST.fr.md`
- Sécurité secrets: `docs/SECURITY-SECRETS.fr.md`
- Git cheat sheet: `docs/GIT-CHEATSHEET.fr.md`
- Guide panneau interne (in-app FR/EN): `/-/studio-ops/help`
- Notes de version 0.5.0-prep: `docs/RELEASE-NOTES.0.5.0-prep.fr.md`
