# Checklist QA V1

## Preparation

1. Lancer `npm install`
2. Lancer `npm run dev`
3. Ouvrir l'app sur desktop et mobile

## Smoke tests

1. Navigation:
   - Verifier les routes `/`, `/math`, `/vocab`
   - Verifier menu burger sur mobile
2. Build:
   - Executer `npm run build` sans erreur
3. Tests:
   - Executer `npm test` sans echec
   - Executer `npm run test:e2e` sans echec

## Math (`/math`)

1. Changer de table et verifier mise a jour immediate de la question
2. Reponse correcte:
   - Score +1
   - Total +1
   - Serie +1
3. Reponse incorrecte:
   - Score inchange
   - Total +1
   - Serie remise a 0
4. Reponse negative:
   - Message d'erreur
   - Total inchange
5. Maintenir `Entree`:
   - Pas de multi-increment du score

## Vocab (`/vocab`)

1. Fleches carrousel:
   - Gauche/droite fonctionnent
2. Clavier:
   - `ArrowLeft`/`ArrowRight` changent de carte
3. Swipe mobile:
   - Un seul changement par geste horizontal
4. Flip carte:
   - Affiche/masque traduction correctement
5. TTS:
   - Bouton play/stop fonctionne
   - Changement accent US/UK pris en compte
   - Pas de message parasite lors d'interruption volontaire

## Zone interne (`/-/studio-ops`)

1. Connexion avec identifiants valides -> acces panel
2. Identifiants invalides:
   - Message generique
   - Affichage tentatives restantes
3. Blocage:
   - 3 echecs => blocage temporaire
   - Champs et bouton desactives pendant blocage
4. Session:
   - Expiration de session => redirection login
5. Edition listes:
   - Import JSON valide/invalide
   - Copie JSON / telechargement JSON
   - Sauvegarde locale visible dans `/vocab`

## CMS (`/cms/`) - si active sur Netlify

1. Connexion Netlify Identity
2. Edition d'une liste
3. Publication (commit Git auto)
4. Verification contenu apres redeploy

## Regression

1. Recharger la page:
   - Accent TTS conserve
   - Overrides localStorage conserves
2. Verifier qu'aucune erreur JS n'apparait dans la console
