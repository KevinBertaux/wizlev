# ROADMAP - WizLev

Document de synthèse. Les scopes détaillés, historiques de version et backlogs restent pilotés par les fichiers JSON dans `src/content/roadmap/*.json` et par le panneau interne.

## Lignes de travail

### Ligne produit

- branche active actuelle : `feat/0.7.0-prep`
- version publique publiée : `0.6.0`
- version de préparation en cours : `0.7.0-dev`
- but :
  - faire avancer la ligne `0.7.0-dev` sans casser la prod `0.6.0`
  - garder la monétisation sur `epic/ads-cmp`, hors ligne produit

### Ligne plateforme

- track transverse actif : `platform` (déjà intégré dans `main`)
- but :
  - tracer les chantiers de plateforme hors version produit stricte
  - conserver visibles le rebrand, le routage canonique et le durcissement CI/QA dans `scope-platform.json`

### Ligne monétisation

- branche épique dédiée : `epic/ads-cmp`
- but :
  - faire avancer AdSense, CMP Google et emplacements pub sans bloquer les releases produit

## Cadre de version

- `0.1.0` : prototype HTML/CSS/JS
- `0.2.0` : stabilisation fonctionnelle initiale
- `0.3.0` : migration vers Vue 3 + Vite
- `0.4.0` : release stable sans backend
- `0.5.0` : release produit sortie le 13 mars 2026
- `0.6.0` : release produit sortie le 25 mars 2026

## Sources de vérité

### Produit

- `feature/*` -> `feat/0.7.0-prep`
- `feat/0.7.0-prep` -> `main` quand release validée

### Monétisation

- `feature/*` liés à la pub -> `epic/ads-cmp`
- `epic/ads-cmp` -> branche produit active quand la monétisation est prête

## Pré-requis AdSense à conserver

Ces éléments doivent survivre sur toutes les branches produit actives :

- `index.html`
  - meta `google-adsense-account`
- `public/ads.txt`

Ils sont considérés comme des prérequis site-level, pas comme une feature pub optionnelle.

## Références utiles

- documentation projet :
  - `README.md`
  - `docs/README.fr.md`
  - `docs/README.en.md`
- release :
  - `docs/RELEASE-CHECKLIST.fr.md`
  - `docs/QA-CHECKLIST.fr.md`
- notes de version :
  - `docs/RELEASE-NOTES.0.6.0.fr.md`