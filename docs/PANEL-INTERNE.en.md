# Internal panel documentation (EN)

This document covers the lightweight technical usage of the ManabuPlay internal panel.

In-app route (FR/EN switch): `/-/studio-ops/help`

## Scope

- Local browser editing for vocabulary lists.
- No server API required in this version.
- JSON export for Git versioning.

## Access and security

- Authentication: username + password verified through client-side SHA-256 hash.
- Level 1 lock: 3 invalid attempts then 30 minutes.
- Level 2 lock: one invalid attempt after level 1 triggers 24 hours.
- Session: automatic timeout.

## Workflow

1. Log in to the panel.
2. Select a list.
3. Edit words and save locally.
4. Verify in the Languages module.
5. Export JSON, then commit/push.

## JSON operations

- Copy JSON
- Download JSON
- Import JSON
- Reset

## Limitations

- Front-only security (not server-equivalent).
- Local data is bound to the current device/browser.
- Browser cleanup may remove local data.

## Glossary

### localStorage
Persistent browser storage for a given domain.

### Hash (SHA-256)
One-way fingerprint used to validate a password without storing plain text.

### Session timeout
Maximum duration before automatic logout.

### Front-only security
Protection implemented only in browser code.

### JSON
Structured text format for data representation.
