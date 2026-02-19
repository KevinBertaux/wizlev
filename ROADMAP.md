# ROADMAP - ManabuPlay

## Cadre de version interne

- `0.1.0`: prototype initial HTML/CSS/JS
- `0.2.0`: migration architecture vers Vue 3 + Vite (SPA)
- `0.3.0`: stabilisation fonctionnelle (Math/Vocab + TTS + zone interne V1)
- `0.4.0-prep`: branche de preparation release actuelle

## Strategie deploy (quota Netlify)

- Objectif: 1 deploy production max par semaine jusqu'au reset quota.
- Les commits peuvent continuer sur branches feature sans deploy prod.
- Validation finale uniquement apres checklist release complete.

## Etat actuel (0.4.0-prep)

### Fait

- [x] Merge `feat/admin-lite-guard` -> `feat/0.4.0-prep`
- [x] Route interne non visible dans le menu public
- [x] Protection front-only: identifiant + hash, rate limit, blocage progressif, timeout session
- [x] Message d'erreur d'auth generique (pas de detail id/mot de passe)
- [x] Documentation panel interne FR/EN
- [x] Tests unitaires auth/router/vocab listes
- [x] Tests E2E Playwright (flux complet `/-/studio-ops` + checks accessibilite de base)
- [x] Hook ggshield local + scan CI GitGuardian

### A faire avant release 0.4.0

- [ ] Verifier et figer le numero de version final (`0.4.0`)
- [ ] Nettoyer/clarifier la place du dossier `backend/` (archive technique V2 non active sur Netlify)
- [ ] Revue finale des textes legaux en production
- [ ] QA mobile complete (Math + Vocab + zone interne)
- [ ] Release notes courtes + tag Git

## Backlog produit

### Priorite haute

- [ ] Module Math: divisions
- [ ] Module Math: symetrie
- [ ] Enrichissement contenu anglais (nouvelles listes)

### Priorite moyenne

- [ ] Base structure multi-langues (anglais + espagnol)
- [ ] Historique local des meilleurs scores par module
- [ ] Amelioration UX panel interne (edition lots, recherche)

### Plus tard

- [ ] Auth serveur reelle (roles, comptes, API)

## Workflow branches (regle retenue)

- `feature/*` -> merge vers `feat/0.4.0-prep`
- `feat/0.4.0-prep` -> merge vers `main` quand release validee
- `main` reste la branche stable/deployable
