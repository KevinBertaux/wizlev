# 🎓 ManabuPlay

Educational web app (Vue 3 + Vite SPA) to help children practice math and vocabulary.

[🇫🇷 Version française](README.fr.md)

## 🏷️ Version

- Current version: `0.3.0` (February 13, 2026)

## ✨ Current features

### 📊 Math (`/math`)
- Multiplication tables quiz (1-11 + all tables mode)
- Score, total answers, and streak tracking
- Keyboard validation (`Enter`) with duplicate-submit prevention

### 🇬🇧 English vocabulary (`/vocab`)
- Flashcards for fruits/vegetables (25 words each)
- Arrow, keyboard, and mobile swipe navigation
- English TTS with 🇺🇸/🇬🇧 accent selection

### 🛠️ Local admin V1 (`/admin`)
- Edit list name/description/words
- Add/remove words
- Import JSON / export JSON / copy JSON
- Local `localStorage` save (immediately visible in `/vocab`)

### 🧾 Netlify/Decap CMS (`/cms/`)
- Collaborative editing of versioned content files
- Automatic Git commits through Git Gateway (once enabled on Netlify)

## 🚀 Local setup

### Prerequisites
- Node.js LTS (v24+ recommended)
- npm

### Run
1. `npm install`
2. `npm run dev`
3. Open the printed URL (example: `http://localhost:5173`)

### Quality checks
- Unit tests: `npm test`
- Production build: `npm run build`

## 📁 Project structure

```text
manabuplay/
├── index.html
├── package.json
├── public/
│   ├── _redirects
│   └── cms/
│       ├── index.html
│       └── config.yml
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── router/
│   │   └── index.js
│   ├── styles/
│   │   └── base.css
│   ├── content/
│   │   └── vocab/
│   │       └── en/
│   │           ├── fruits.json
│   │           └── legumes.json
│   ├── features/
│   │   ├── math/
│   │   │   ├── quizEngine.js
│   │   │   └── quizEngine.test.js
│   │   └── vocab/
│   │       ├── adminPayload.js
│   │       ├── adminPayload.test.js
│   │       └── vocabLists.js
│   └── views/
│       ├── HomeView.vue
│       ├── MathView.vue
│       ├── VocabView.vue
│       ├── AdminView.vue
│       ├── LegalMentionsView.vue
│       └── LegalPrivacyView.vue
├── legacy/
│   ├── index.v0.3.0.html
│   ├── js/
│   │   ├── app.js
│   │   ├── math.js
│   │   └── vocabulary.js
│   └── data/
│       ├── vocab-fruits.json
│       └── vocab-legumes.json
└── docs/
    ├── README.fr.md
    ├── README.en.md
    ├── MIGRATION.md
    └── QA-CHECKLIST.fr.md
```

## 🧭 SPA routes

- `/` : Home
- `/math` : Math module
- `/vocab` : Vocabulary module
- `/admin` : Local admin V1
- `/legal/mentions-legales` : Legal notices (placeholder)
- `/legal/confidentialite` : Privacy page (placeholder)

Static route:
- `/cms/` : Decap CMS

## ✍️ Editing vocabulary content

### Option A (team recommended): CMS
1. Open `/cms/`
2. Sign in (Netlify Identity)
3. Edit lists
4. Publish (auto Git commit)

### Option B (developer)
1. Edit `src/content/vocab/en/*.json`
2. Commit/push

### Option C (quick local test)
1. Use `/admin`
2. Save locally (localStorage)

## 🌐 Netlify deployment (Vue SPA)

### Recommended settings
- Build command: `npm run build`
- Publish directory: `dist`

### SPA redirect
`public/_redirects`:
```text
/* /index.html 200
```

### CMS activation (once on Netlify)
1. Enable **Identity**
2. Enable **Git Gateway**
3. Invite CMS editors

Detailed step-by-step setup guide (French):
- `docs/SETUP-GITHUB-NETLIFY-CMS.fr.md`

## 📱 Compatibility

- ✅ Chrome / Edge / Brave
- ✅ Firefox
- ✅ Safari (recent iOS/macOS)
- ✅ Desktop + mobile
- ✅ Internet connection required (no PWA offline mode yet)

## ⚠️ Current limitations

- `/admin` remains local to a device/browser (localStorage)
- No advanced role model (RBAC) for CMS yet
- Legal pages are still placeholders in-app

## 📄 License

Free to use for personal and educational purposes.

