# Migration Vue/Vite

L'ancienne version statique est conservée pour référence:

- legacy/index.v0.3.0.html
- legacy/js/app.js
- legacy/js/math.js
- legacy/js/vocabulary.js

État actuel:

1. Socle Vue/Vite en place
2. Module `/vocab` migré
3. Module `/math` migré
4. Admin local V1 (`/admin`) migré
5. Decap CMS ajouté sur `/cms/`
6. Les anciens scripts `assets/js/*.js` sont sortis du runtime Vue et archivés dans `legacy/js`
7. Les anciens JSON `assets/data/*.json` sont archivés dans `legacy/data`

Prochaines étapes:

1. Activer Netlify Identity + Git Gateway pour `/cms/`
2. Ajouter la base de l'espagnol dans `src/content/vocab/es`
3. Remplacer progressivement l'admin local `/admin` par un admin connecté (si nécessaire)
