import { createRouter, createWebHistory } from 'vue-router';

const ADMIN_SESSION_KEY = 'manabuplay_admin_authenticated';
const ADMIN_DEFAULT_PASSWORD = 'manabuplay-admin';

function isAdminAuthenticated() {
  if (typeof window === 'undefined') {
    return false;
  }
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function setAdminAuthenticated(value) {
  if (typeof window === 'undefined') {
    return;
  }
  if (value) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    return;
  }
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function getAdminPassword() {
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  if (typeof envPassword === 'string' && envPassword.trim()) {
    return envPassword.trim();
  }
  return ADMIN_DEFAULT_PASSWORD;
}

function requestAdminPassword() {
  if (typeof window === 'undefined') {
    return false;
  }

  const typedPassword = window.prompt('Accès Admin protégé. Entrez le mot de passe :');
  if (typedPassword === null) {
    return false;
  }

  const valid = typedPassword === getAdminPassword();
  if (!valid) {
    window.alert('Mot de passe incorrect.');
    setAdminAuthenticated(false);
    return false;
  }

  setAdminAuthenticated(true);
  return true;
}

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/math',
    name: 'math',
    component: () => import('@/views/MathView.vue'),
  },
  {
    path: '/vocab',
    name: 'vocab',
    component: () => import('@/views/VocabView.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAdminPassword: true },
  },
  {
    path: '/legal/mentions-legales',
    name: 'mentions-legales',
    component: () => import('@/views/LegalMentionsView.vue'),
  },
  {
    path: '/legal/confidentialite',
    name: 'confidentialite',
    component: () => import('@/views/LegalPrivacyView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (!to.meta.requiresAdminPassword) {
    return true;
  }

  if (isAdminAuthenticated()) {
    return true;
  }

  const ok = requestAdminPassword();
  if (ok) {
    return true;
  }

  return { name: 'home' };
});

export default router;
