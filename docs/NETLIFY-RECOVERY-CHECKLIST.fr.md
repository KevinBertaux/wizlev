# Netlify - Procedure de reprise apres incident quota

Annexe incident. Ce document ne remplace pas la checklist release.

## Objectif

Reprendre un deploiement propre apres suspension ou tension forte sur le quota Netlify.

## Go / No-Go incident

- [ ] date de reset atteinte si le site a ete suspendu
- [ ] site Netlify non marque comme suspendu
- [ ] credits disponibles >= `15.0`
- [ ] preuve du quota et du statut relevee avant decision

Si un point est faux : **NO-GO**.

## Controles minimaux apres reprise

- [ ] page d accueil repond en `200`
- [ ] assets critiques repondent en `200`
- [ ] modules publics critiques chargent sans erreur majeure
- [ ] pages legales accessibles
- [ ] assets statiques critiques presents (`logo`, favicon, `ads.txt` si concerne)

## Decision

- [ ] decision finale tracee : `GO PROD` ou `NO-GO`
- [ ] cause de l incident notee dans le suivi de release
- [ ] prochain deploiement planifie avec budget explicite
