# Documentation du panel interne (FR)

Cette documentation couvre l'usage technique léger du panel interne de ManabuPlay.

Version in-app (switch FR/EN): `/-/studio-ops/help`

## Périmètre

- Édition locale des listes de vocabulaire via le navigateur.
- Aucune API serveur nécessaire pour cette version.
- Export JSON pour versionner les changements dans Git.

## Accès et sécurité

- Authentification: identifiant + mot de passe vérifié via hash SHA-256 côté client.
- Blocage niveau 1: 3 tentatives invalides puis 30 minutes.
- Blocage niveau 2: une tentative invalide après niveau 1 déclenche 24 heures.
- Session: timeout automatique.

## Workflow

1. Se connecter au panel.
2. Sélectionner une liste.
3. Modifier les mots et sauvegarder localement.
4. Vérifier dans le module Langues.
5. Exporter JSON puis commit/push.

## Opérations JSON

- Copier JSON
- Télécharger JSON
- Importer JSON
- Réinitialiser

## Limites

- Sécurité front-only (pas équivalent serveur).
- Données locales liées à l'appareil/navigateur.
- Nettoyage navigateur peut supprimer les données locales.

## Glossaire

### localStorage
Stockage persistant du navigateur pour un domaine donné.

### Hash (SHA-256)
Empreinte irréversible utilisée pour vérifier un mot de passe sans stockage en clair.

### Timeout de session
Durée maximum d'une session avant déconnexion automatique.

### Front-only security
Protection appliquée uniquement côté navigateur.

### JSON
Format texte structuré pour représenter des données.
