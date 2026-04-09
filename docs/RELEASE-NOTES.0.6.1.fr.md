# Release Notes - 0.6.1

Date: 9 avril 2026

## Résumé

Cette release `0.6.1` est un hotfix ciblé sur la robustesse du chargement distant R2. Elle corrige le scénario où un vieux `manifest.json` servi depuis le cache du navigateur empêchait l'apparition de nouveaux contenus pourtant bien publiés sur R2.

## Correctifs principaux

- R2 / cache :
  - fetch des `manifest.json` distants avec une politique de cache durcie (`no-store`) ;
  - fetch des payloads distants avec une URL versionnée (`?v=...`) pour éviter les collisions de cache ;
  - comportement aligné sur les trois modules distants :
    - Anglais
    - Français
    - Symétrie
- Qualité :
  - tests remote mis à jour pour vérifier explicitement la politique de cache du manifest ;
  - tests remote mis à jour pour vérifier les URLs versionnées des payloads.

## Impact produit

- les nouveautés publiées sur R2 doivent remonter de manière plus fiable sans demander à l'utilisateur de vider son cache ;
- aucune nouvelle fonctionnalité visible n'est embarquée localement dans cette release ;
- le fallback canon local reste conservé en cas d'échec réseau ou de payload distant invalide.

## Notes techniques

- le correctif ne change pas l'arborescence R2 ;
- le manifest canon local reste une baseline de sécurité, mais le contrôle de fraîcheur du manifest distant est durci ;
- cette release prépare les prochains enrichissements distants sans imposer de redéploiement produit pour chaque ajout de contenu.
