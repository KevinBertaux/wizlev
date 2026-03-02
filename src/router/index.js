import { createRouter, createWebHistory } from 'vue-router';
import { isAdminSessionValid } from '@/features/admin/auth';
import { ROUTE_NAMES, ROUTE_PATHS } from './routes';

const routes = [
  {
    path: ROUTE_PATHS.HOME,
    name: ROUTE_NAMES.HOME,
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: ROUTE_PATHS.MATH_HUB,
    name: ROUTE_NAMES.MATH_HUB,
    component: () => import('@/views/MathHubView.vue'),
  },
  {
    path: ROUTE_PATHS.MATH_MULTIPLICATIONS,
    name: ROUTE_NAMES.MATH_MULTIPLICATIONS,
    component: () => import('@/views/MathView.vue'),
  },
  {
    path: ROUTE_PATHS.MATH_SYMMETRY,
    name: ROUTE_NAMES.MATH_SYMMETRY,
    component: () => import('@/views/MathSymmetryView.vue'),
  },
  {
    path: ROUTE_PATHS.LANGUAGES_HUB,
    name: ROUTE_NAMES.LANGUAGES_HUB,
    component: () => import('@/views/LanguagesHubView.vue'),
  },
  {
    path: ROUTE_PATHS.LANGUAGES_ENGLISH,
    name: ROUTE_NAMES.LANGUAGES_ENGLISH,
    component: () => import('@/views/VocabView.vue'),
  },
  {
    path: ROUTE_PATHS.STUDIO_OPS_HELP,
    name: ROUTE_NAMES.STUDIO_OPS_HELP,
    component: () => import('@/views/StudioOpsHelpView.vue'),
    meta: { requiresStudioOpsAuth: true },
  },
  {
    path: ROUTE_PATHS.STUDIO_OPS_LOGIN,
    name: ROUTE_NAMES.STUDIO_OPS_LOGIN,
    component: () => import('@/views/AdminAccessView.vue'),
  },
  {
    path: ROUTE_PATHS.STUDIO_OPS_PANEL,
    name: ROUTE_NAMES.STUDIO_OPS_PANEL,
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresStudioOpsAuth: true },
  },
  {
    path: ROUTE_PATHS.LEGAL_NOTICE,
    name: ROUTE_NAMES.LEGAL_NOTICE,
    component: () => import('@/views/LegalMentionsView.vue'),
  },
  {
    path: ROUTE_PATHS.LEGAL_PRIVACY,
    name: ROUTE_NAMES.LEGAL_PRIVACY,
    component: () => import('@/views/LegalPrivacyView.vue'),
  },
  {
    path: ROUTE_PATHS.LEGAL_TERMS,
    name: ROUTE_NAMES.LEGAL_TERMS,
    component: () => import('@/views/LegalTermsView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: ROUTE_PATHS.HOME,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (!to.meta.requiresStudioOpsAuth) {
    return true;
  }

  if (isAdminSessionValid()) {
    return true;
  }

  return { name: ROUTE_NAMES.STUDIO_OPS_LOGIN };
});

export default router;
