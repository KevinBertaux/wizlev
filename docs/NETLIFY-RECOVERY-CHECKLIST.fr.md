# Netlify - Checklist de reprise apres suspension quota

Objectif: remettre `https://manabuplay.netlify.app` en ligne de facon fiable apres suspension quota, avec gate strict GO/NO-GO.

## 1) Pre-check quota (GO/NO-GO absolu)

- [ ] Date de reset quota atteinte (cible: `9 mars 2026`).
- [ ] Site Netlify non marque "suspended".
- [ ] Credits disponibles >= `15.0`.
- [ ] Une capture du dashboard Netlify (quota + statut) est conservee.

Regle:
- Si un point est faux -> **NO-GO** (aucun deploy).

## 2) Verification post-reactivation (prod)

### 2.1 Disponibilite HTTP

- [ ] `GET /` renvoie `200`.
- [ ] `GET /brand-logo.png` renvoie `200`.
- [ ] Les assets JS/CSS references dans le HTML renvoient `200`.
- [ ] Aucun `404` ou `499` repete sur les assets critiques.

### 2.2 Parcours applicatifs

- [ ] Accueil: chargement complet et navigation menu OK.
- [ ] Math multiplications: selection table, verification reponse, score OK.
- [ ] Math symetrie: selection option, verification, question suivante OK.
- [ ] Anglais: chargement liste, flip carte, navigation, TTS au clic OK.
- [ ] Pages legales: Mentions / Confidentialite / CGU accessibles.

### 2.3 Zone interne

- [ ] `/-/studio-ops` accessible.
- [ ] Auth ok avec identifiants valides.
- [ ] `/-/studio-ops/panel` et `/-/studio-ops/help` accessibles apres login.

## 3) Validation finale

- [ ] Build deploye confirme dans Netlify (log "published").
- [ ] Verification finale manuelle completee sans regression critique.
- [ ] Horodatage de validation note (date/heure locale).
- [ ] Decision finale enregistree: `GO PROD` ou `NO-GO`.

## 4) Post-incident (obligatoire)

- [ ] Renseigner la cause (quota insuffisant) dans la release checklist.
- [ ] Reconfirmer la regle stricte: aucun deploy si credits < `15.0`.
- [ ] Planifier le prochain deploy avec budget explicite.
