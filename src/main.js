/* eslint-disable no-console */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@fontsource/lexend/400.css';
import '@fontsource/lexend/600.css';
import '@fontsource/lexend/700.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import App from './App.vue';
import router from './router';
import { applyPublicSeoToDocument } from './features/seo/publicSeo';
import './styles/base.css';
import './styles/quiz-modules.css';

if (import.meta.env.DEV && typeof document !== 'undefined') {
  const devFaviconPath = '/android-chrome-512x512%20dev.png';
  const faviconSelectors = [
    'link[rel="icon"]',
    'link[rel="apple-touch-icon"]',
  ];

  faviconSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.setAttribute('href', devFaviconPath);
    });
  });
}

const app = createApp(App);

app.use(createPinia());
app.use(router);
router.isReady().then(() => {
  if (typeof window !== 'undefined') {
    applyPublicSeoToDocument({ pathname: router.currentRoute.value.fullPath, hostname: window.location.hostname });
  }
});
app.mount('#app');

console.log('App Vue initialisée');

