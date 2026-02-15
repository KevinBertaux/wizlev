import { createRouter, createWebHistory } from 'vue-router';

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

export default router;
