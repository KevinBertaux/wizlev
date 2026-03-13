# Checklist QA - ManabuPlay

Document qualite cible. Il sert a preparer et executer la validation fonctionnelle et technique avant une release ou un lot sensible.

## 1. Preparation

- [ ] `npm install`
- [ ] `npm run dev`
- [ ] application ouverte sur desktop
- [ ] application ouverte sur mobile ou viewport mobile credible

## 2. Controles automatises

- [ ] `npm run check:breakpoints`
- [ ] `npm run check:spacing`
- [ ] `npm test`
- [ ] `npm run test:e2e`
- [ ] `npm test -- --coverage`
- [ ] `npm run build`

## 3. Couverture

- [ ] branches >= `70%`
- [ ] functions >= `80%`
- [ ] statements >= `55%`
- [ ] lines >= `55%`
- [ ] regle ratchet only respectee

## 4. Smoke tests produit

### Navigation publique

- [ ] accueil OK
- [ ] hub Math OK
- [ ] hub Langues OK
- [ ] menu responsive OK
- [ ] pages legales OK

### Multiplications

- [ ] aucune table pre-selectionnee
- [ ] changement de selection immediat
- [ ] bonne reponse : score / total / serie coherents
- [ ] mauvaise reponse : feedback coherent
- [ ] meilleure serie persistante
- [ ] clavier et pave numerique coherents

### Symetrie

- [ ] selection et validation coherentes
- [ ] score / serie / meilleure serie coherents
- [ ] passage a la question suivante sans regression UX

### Anglais

- [ ] aucune liste pre-selectionnee
- [ ] titre et compteur de mots coherents
- [ ] description de liste coherente
- [ ] navigation cartes OK
- [ ] revelation traduction OK
- [ ] TTS OK
- [ ] sens de carte OK

## 5. Zone interne

- [ ] acces interne non visible dans le menu public
- [ ] connexion valide -> acces panneau
- [ ] connexion invalide -> message generique coherent
- [ ] blocage temporaire coherent
- [ ] expiration de session coherente
- [ ] edition locale / import / export / copie OK

## 6. Regression transverse

- [ ] aucun crash JS en console
- [ ] rechargement page sans perte inattendue d etat
- [ ] localStorage coherent
- [ ] responsive coherent sur les vues critiques
