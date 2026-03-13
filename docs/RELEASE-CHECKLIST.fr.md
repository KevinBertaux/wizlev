# Checklist Release - ManabuPlay

Document operationnel de sortie. Il sert a decider si une branche produit peut passer vers `main`, puis etre deployee.

## Perimetre

- branche produit cible : `feat/0.5.0-prep`
- branche de publication : `main`
- la ligne monetisation (`epic/ads-cmp`) suit son propre cycle et ne bloque pas la release produit

## 1. Go / No-Go release

### Produit

- [ ] version cible confirmee
- [ ] perimetre de release fige
- [ ] aucune regression critique ouverte
- [ ] notes de version pretes

### Technique

- [ ] `npm install` OK
- [ ] `npm run check:breakpoints` OK
- [ ] `npm run check:spacing` OK
- [ ] `npm test` OK
- [ ] `npm run test:e2e` OK
- [ ] `npm test -- --coverage` OK
- [ ] `npm run build` OK

### CI

- [ ] workflow release vert sur la branche cible
- [ ] matrix E2E verte
- [ ] QA Visual Regression verifiee si le lot la concerne
- [ ] aucun ecart de seuil coverage non valide

### Conformite documentaire

- [ ] `README.md` coherent avec l etat reel du projet
- [ ] hubs `docs/README.fr.md` et `docs/README.en.md` coherents
- [ ] `ROADMAP.md` coherent avec les sources JSON
- [ ] pages legales coherentes avec le comportement reel

## 2. Pre-checks de publication

- [ ] branche de publication confirmee : `main`
- [ ] quota Netlify verifie juste avant le deploiement
- [ ] credit disponible >= `15.0`
- [ ] site Netlify non suspendu
- [ ] variables d environnement de production verifiees

Si un de ces points est faux : **NO-GO deploiement**.

## 3. Publication

- [ ] merge `feat/0.5.0-prep` -> `main`
- [ ] push final sur `main`
- [ ] deploiement Netlify lance
- [ ] deploiement Netlify termine avec succes

## 4. Verifications post-deploiement

- [ ] accueil accessible
- [ ] hubs Math et Langues accessibles
- [ ] modules publics critiques accessibles et fonctionnels
- [ ] pages legales accessibles
- [ ] favicon / logo / assets critiques OK
- [ ] `ads.txt` accessible si present dans la release
- [ ] meta site-level attendue presente si concernee

## 5. Post-release

- [ ] tag Git cree
- [ ] notes de version archivees / validees
- [ ] prochaine branche produit planifiee si besoin
