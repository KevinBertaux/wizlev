# ROADMAP - ManabuPlay

## Cadre de version interne

- [x] `0.1.0` Prototype initial HTML/CSS/JS (prototype initial)
- [x] `0.2.0` Migration architecture vers Vue 3 + Vite (SPA)
- [x] `0.3.0` Stabilisation fonctionnelle (Math/Vocab/Admin V1 + TTS + docs)
- [ ] `0.4.0` Prochaine release cible: consolidation produit + pipeline deploy sobre + backlog prioritaire

## Stratégie "1 deploy/semaine max" jusqu'au 9 mars 2026

- [x] Contrainte budget identifiée: coût deploy Netlify élevé, quota limité avant reset
- [x] Geler les déploiements automatiques non essentiels (pause builds sur Netlify)
- [ ] Déploiement 1 prévu: semaine du 16 février 2026
- [ ] Déploiement 2 prévu: semaine du 23 février 2026
- [ ] Déploiement 3 prévu: semaine du 2 mars 2026
- [ ] Reprise cadence normale après reset quota du 9 mars 2026

## Livré (historique consolidé)

### Produit et architecture
- [x] Migration SPA vers Vue 3 + Vite
- [x] Routage principal (`/`, `/math`, `/vocab`, `/admin`, pages légales)
- [x] Redirection SPA Netlify (`public/_redirects`)
- [x] Renommage global du projet en **ManabuPlay**
- [x] README racine orienté GitHub vitrine

### Module Math
- [x] Quiz tables 1 à 11 + mode toutes tables
- [x] Correction multi-validation clavier (`Entrée` maintenue)
- [x] Mise à jour immédiate de la question lors du changement de table
- [x] Blocage des réponses négatives
- [x] Score / total / série stabilisés

### Module Langues (anglais)
- [x] Source vocabulaire JSON externe (single source of truth)
- [x] Flashcards fruits/légumes (25 mots)
- [x] Navigation clavier/flèches/swipe mobile
- [x] Refonte UI carte (centrage, hiérarchie texte, états)
- [x] Intégration TTS V1 (clic uniquement, pas d'autoplay)
- [x] Choix accent anglais US/UK
- [x] Bouton Play/Stop unique
- [x] Masquage bouton TTS si non supporté
- [x] Correction messages parasites TTS sur interruption/changement de carte
- [x] Compatibilité de migration des clés `localStorage` legacy -> nouvelles clés

### Admin V1
- [x] Migration admin local dans `/admin`
- [x] Édition listes JSON (nom, description, mots)
- [x] Ajout/suppression/import/export/copie JSON
- [x] Amélioration UX ajout de mots (bouton flottant, focus)
- [x] Aucune liste préchargée par défaut
- [x] Protection par mot de passe de la route `/admin`
- [x] Mot de passe configurable via `.env` (`VITE_ADMIN_PASSWORD`)
- [x] Retrait des accès visuels `Admin` dans l'interface (accès URL direct uniquement)

### CMS / Netlify
- [x] Structure Decap CMS en place (`/cms`)
- [x] Documentation pas-à-pas GitHub -> Netlify -> Identity -> Git Gateway
- [x] Clarification blocage Git Gateway si site non connecté en CD GitHub/GitLab

### Conformité et documentation
- [x] Mentions légales rédigées (éditeur non-professionnel, anonymisation publique)
- [x] Politique de confidentialité rédigée (RGPD + mineurs + stockage local)
- [x] Mention explicite du cadre mineurs (<15 ans pour consentement futur)
- [x] Documentation alignée avec le comportement réel
- [x] Favicon pack complet intégré (`favicon_io`)

### UX / Navigation
- [x] Remplacement boutons précédent/suivant vocab par flèches type carrousel
- [x] Déplacement bouton mélanger (itérations UI)
- [x] Logo de marque en header cliquable
- [x] Capture doc d'accueil mise à jour sans bloc Admin

## Références opérationnelles

- [x] Checklist release hebdo créée : `docs/RELEASE-CHECKLIST.fr.md`

## À faire (priorisé)

### Priorité haute
- [ ] Remplacer la protection front `/admin` par une protection serveur réelle (auth robuste)
- [ ] Finaliser Identity + Git Gateway en production avec workflow test complet
- [x] Écrire une checklist release légère (Go/No-Go avant deploy hebdo)
- [ ] Mettre en place un `CHANGELOG.md` versionné

### Priorité produit
- [ ] Ajouter module Math: divisions
- [ ] Ajouter module Math: symétrie
- [ ] Ajouter base module Langues: espagnol
- [ ] Définir structure de contenu multi-langue (`src/content/vocab/en`, `es`, ...)

### Priorité qualité
- [ ] Ajouter tests E2E parcours critiques (nav, admin protégé, tts, math)
- [ ] Ajouter tests unitaires route guard admin
- [ ] Ajouter contrôle QA mobile systématique avant chaque deploy

### Priorité conformité
- [ ] Vérification juridique finale par professionnel (mentions/confidentialité)
- [ ] Formaliser procédure d'exercice des droits RGPD (réponse sous délai)
- [ ] Préparer registre simplifié des traitements (même minimal)

### Priorité ops
- [ ] Documenter stratégie branches (`main`, `feature/*`, `fix/*`, `docs/*`)
- [ ] Définir convention commits (`feat`, `fix`, `docs`, `chore`)
- [ ] Ajouter tags release (`v0.4.0`, etc.)

## Définition de version recommandée

- [x] Règle active: SemVer en phase pré-1.0 (`0.MINOR.PATCH`)
- [ ] `MINOR` pour feature/changement visible
- [ ] `PATCH` pour correctif sans nouvelle capacité
- [ ] Passage en `1.0.0` quand produit + process de release + conformité sont stabilisés

## Cible de la prochaine version

- [ ] Proposition: préparer `0.4.0` juste avant le prochain deploy hebdomadaire validé




