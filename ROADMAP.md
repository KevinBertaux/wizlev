# ROADMAP - ManabuPlay

## Cadre de version interne

- `0.1.0`: prototype initial HTML/CSS/JS
- `0.2.0`: migration architecture vers Vue 3 + Vite (SPA)
- `0.3.0`: stabilisation fonctionnelle (Math/Vocab + TTS + zone interne V1)
- `0.4.0`: release stable sans backend (localStorage/front-only)
- `0.5.0-prep`: préparation release en cours (branche cible: `feat/0.5.0-prep`)

## Stratégie deploy (quota Netlify)

- Objectif: 1 déploy production max par semaine jusqu'au reset quota.
- Les commits continuent sur branches feature sans déploy prod.
- Validation finale uniquement après checklist release complète.

## Scope 0.5.0

### Crit (bloquant release)

- [x] Supprimer les traces CMS legacy.
- [x] Harmoniser les pages légales (Mentions, Confidentialité, CGU) et leurs dates.
- [x] Conserver un mode 100% statique Netlify (pas de backend obligatoire pour 0.5.0).
- [ ] Validation finale pré-release: `npm test`, `npm run test:e2e`, `npm run build`.
- [ ] QA manuelle finale desktop + mobile.
- [ ] Merge `feat/0.5.0-prep` -> `main` + déploy Netlify (fenêtre quota).

---

### High (important 0.5.0)

- [x] Refonte Accueil V1 par sections matières (Mathématiques, Langues).
- [x] Module Symétrie V1 QCM (axes vertical + horizontal).
- [x] Symétrie: enrichissement des formes (ouvert/fermé).
- [x] Multiplications: table de 0 + aucune table sélectionnée par défaut.
- [x] Multiplications/Symétrie: feedbacks et boutons harmonisés.
- [x] Système de motivation (toast): jalon x3 session, record série 1 fois par run, paliers.
- [x] Tailwind CSS v3 intégré comme base outillage (sans refonte brutale).
- [x] Durcissement UX/admin léger (messages clairs, import/export JSON plus fiable).
- [x] Système de sac (général): moteur réutilisable (`questionBag`) extrait.
- [x] Système de sac (intégrations): branché sur Symétrie et Multiplications.
- [x] Système de difficulté (Multiplications): modes `Découverte` / `Standard` / `Renforcé` / `Infini`.
- [x] Système de difficulté (Multiplications): UI de sélection difficulté (boutons segmentés).
- [x] Multiplications: pavé numérique desktop/tablette.

---

### Med (optimisation / maintenabilité)

- [x] Refactor UI quiz en composants réutilisables:
  - `QuizScoreBar`
  - `QuizFeedbackBanner`
  - `QuizActions`
  - `QuizSelectField`
  - `QuizEmptyState`
- [x] Refactor logique quiz:
  - `useQuizFlow`
- [x] Refactor admin:
  - `AdminStatusBanner`
  - `useSessionCountdown`
- [x] Refactor layout légal:
  - `LegalPageLayout`
- [ ] Passage de cohérence doc final 0.5.0 (README + docs FR/EN + release notes).

---

### Low (confort / polish, non bloquant)

- [ ] Ajustements micro-copy non bloquants (textes secondaires, libellés fins).
- [ ] Polissage visuel léger (espacements fins, petites animations non critiques).
- [ ] Refactor CSS mineur restant (duplications faibles, renommages de clarté).
- [ ] Nettoyage technique léger (commentaires internes, noms de variables/fonctions).

## Fait en plus pendant 0.5.0-prep

- [x] UI/UX: harmonisation hover/focus/contrastes sur l'ensemble du site.
- [x] Navigation: menu plus clair et responsive.
- [x] Vocabulaire: sens de carte EN->FR / FR->EN, vitesse TTS en 3 niveaux, options de prononciation.
- [x] Vocabulaire: listes JSON enrichies (titre + description + compteur de mots + emojis).
- [x] Sécurité secrets: ggshield local + workflow GitGuardian CI.
- [x] Nettoyage branches feature après merge (au fil de l'eau).

## Backlog 0.6+

### Priorité haute

- [ ] Module Math: divisions.
- [ ] Évolution Symétrie V2 (placement de points sur quadrillage).
- [ ] Monétisation à cadrer (pub kids-safe + conformité RGPD/CNIL).

### Priorité moyenne

- [ ] Base structure multi-langues complète (anglais + espagnol).
- [ ] Historique local des meilleurs scores par module/profil.
- [ ] UX admin V2 (édition par lots, recherche, filtres, validation avancée).
- [ ] Timer d'exercice configurable (par module/niveau).
- [ ] Système global d'info-bulles (tooltips) cohérent sur tout le site.

### Plus tard

- [ ] Auth serveur réelle (rôles, comptes, API).
- [ ] Backend persistant (quand sortie Netlify free / infra mutualisée pertinente).

## Workflow branches (règle retenue)

- `feature/*` -> merge vers `feat/0.5.0-prep`
- `feat/0.5.0-prep` -> merge vers `main` quand release validée
- `main` reste la branche stable/deployable
