<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ROUTE_NAMES } from "@/router/routes";

const navOpen = ref(false);
const openGroup = ref("");
const isHeaderCompact = ref(false);
const hoverOpenTimer = ref(null);
const hoverCloseTimer = ref(null);
const route = useRoute();
const router = useRouter();

const isMathRoute = computed(() => route.path.startsWith("/math"));
const isLangRoute = computed(() => route.path.startsWith("/languages"));
const isLegalRoute = computed(() => route.path.startsWith("/legal"));
const isAdminPanelRoute = computed(() => route.path.startsWith("/-/studio-ops/panel"));

watch(
  () => route.fullPath,
  () => {
    navOpen.value = false;
    openGroup.value = "";
    clearHoverOpenTimer();
    clearHoverCloseTimer();
  }
);

function clearHoverOpenTimer() {
  if (hoverOpenTimer.value !== null) {
    window.clearTimeout(hoverOpenTimer.value);
    hoverOpenTimer.value = null;
  }
}

function clearHoverCloseTimer() {
  if (hoverCloseTimer.value !== null) {
    window.clearTimeout(hoverCloseTimer.value);
    hoverCloseTimer.value = null;
  }
}

function isDesktopHoverNav() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches;
}

function toggleMenu() {
  navOpen.value = !navOpen.value;
  if (!navOpen.value) {
    openGroup.value = "";
  }
}

function toggleGroup(groupName) {
  openGroup.value = openGroup.value === groupName ? "" : groupName;
}

function navigateToTopLevelHub(groupName) {
  const routeName = groupName === "math" ? ROUTE_NAMES.MATH_HUB : ROUTE_NAMES.LANGUAGES_HUB;
  router.push({ name: routeName });
}

function handleTopLevelTriggerClick(groupName) {
  if (isDesktopHoverNav()) {
    clearHoverOpenTimer();
    clearHoverCloseTimer();
    openGroup.value = "";
    navigateToTopLevelHub(groupName);
    return;
  }

  toggleGroup(groupName);
}

function handleNavGroupMouseEnter(groupName) {
  if (!isDesktopHoverNav()) {
    return;
  }

  clearHoverOpenTimer();
  clearHoverCloseTimer();
  if (openGroup.value && openGroup.value !== groupName) {
    openGroup.value = groupName;
    return;
  }
  hoverOpenTimer.value = window.setTimeout(() => {
    openGroup.value = groupName;
    hoverOpenTimer.value = null;
  }, 300);
}

function handleNavGroupMouseLeave(groupName) {
  if (!isDesktopHoverNav()) {
    return;
  }

  clearHoverOpenTimer();
  clearHoverCloseTimer();
  hoverCloseTimer.value = window.setTimeout(() => {
    if (openGroup.value === groupName) {
      openGroup.value = "";
    }
    hoverCloseTimer.value = null;
  }, 180);
}

function closeNav() {
  navOpen.value = false;
  openGroup.value = "";
  clearHoverOpenTimer();
  clearHoverCloseTimer();
}

function updateHeaderCompactState() {
  if (typeof window === "undefined") {
    return;
  }

  isHeaderCompact.value = window.scrollY > 24;
}

onMounted(() => {
  updateHeaderCompactState();
  window.addEventListener("scroll", updateHeaderCompactState, { passive: true });
});

onUnmounted(() => {
  clearHoverOpenTimer();
  clearHoverCloseTimer();
  window.removeEventListener("scroll", updateHeaderCompactState);
});
</script>

<template>
  <div class="app-shell">
    <header class="topbar" :class="{ 'topbar--compact': isHeaderCompact }">
      <router-link :to="{ name: ROUTE_NAMES.HOME }" class="brand" aria-label="Accueil" @click="closeNav">
        <span class="brand-wordmark" aria-hidden="true">
          <span class="brand-wordmark__wiz">Wiz</span><span class="brand-wordmark__lev">Lev</span>
        </span>
      </router-link>

      <button
        class="burger"
        type="button"
        :aria-expanded="navOpen ? 'true' : 'false'"
        aria-controls="main-nav"
        aria-label="Ouvrir le menu"
        @click="toggleMenu"
      >
        &#9776;
      </button>

      <nav id="main-nav" class="main-nav" :class="{ open: navOpen }">
        <div class="nav-cluster">
          <div
            class="nav-group"
            :class="{ open: openGroup === 'math' }"
            @mouseenter="handleNavGroupMouseEnter('math')"
            @mouseleave="handleNavGroupMouseLeave('math')"
          >
            <button
              class="nav-trigger"
              type="button"
              :class="{ active: isMathRoute }"
              :aria-expanded="openGroup === 'math' ? 'true' : 'false'"
              @click="handleTopLevelTriggerClick('math')"
            >
              Maths
            </button>
            <div class="submenu">
              <router-link class="submenu-link" :to="{ name: ROUTE_NAMES.MATH_MULTIPLICATIONS }" @click="closeNav">
                Multiplications
              </router-link>
              <router-link class="submenu-link" :to="{ name: ROUTE_NAMES.MATH_SYMMETRY }" @click="closeNav">
                Symétrie
              </router-link>
            </div>
          </div>

          <div
            class="nav-group"
            :class="{ open: openGroup === 'lang' }"
            @mouseenter="handleNavGroupMouseEnter('lang')"
            @mouseleave="handleNavGroupMouseLeave('lang')"
          >
            <button
              class="nav-trigger"
              type="button"
              :class="{ active: isLangRoute }"
              :aria-expanded="openGroup === 'lang' ? 'true' : 'false'"
              @click="handleTopLevelTriggerClick('lang')"
            >
              Langues
            </button>
            <div class="submenu">
              <router-link class="submenu-link" :to="{ name: ROUTE_NAMES.LANGUAGES_ENGLISH }" @click="closeNav">
                Anglais
              </router-link>
              <router-link class="submenu-link" :to="{ name: ROUTE_NAMES.LANGUAGES_FRENCH }" @click="closeNav">
                Français
              </router-link>
            </div>
          </div>
        </div>

        <div class="nav-group nav-group--legal" :class="{ open: openGroup === 'info' }">
          <button
            class="nav-trigger"
            type="button"
            :class="{ active: isLegalRoute }"
            :aria-expanded="openGroup === 'info' ? 'true' : 'false'"
            @click="toggleGroup('info')"
          >
            Informations
          </button>
          <div class="submenu">
            <router-link class="submenu-link" :to="{ name: ROUTE_NAMES.LEGAL_NOTICE }" @click="closeNav">
              Mentions légales
            </router-link>
            <router-link class="submenu-link" :to="{ name: ROUTE_NAMES.LEGAL_TERMS }" @click="closeNav">
              CGU
            </router-link>
            <router-link class="submenu-link" :to="{ name: ROUTE_NAMES.LEGAL_PRIVACY }" @click="closeNav">
              Politique de confidentialité
            </router-link>
            <router-link class="submenu-link" :to="{ name: ROUTE_NAMES.LEGAL_COOKIES }" @click="closeNav">
              Cookies
            </router-link>
          </div>
        </div>
      </nav>
    </header>

    <main class="page-container" :class="{ 'admin-shell-container': isAdminPanelRoute }">
      <router-view />
    </main>

    <footer class="site-footer">
      <div class="footer-links">
        <router-link :to="{ name: ROUTE_NAMES.LEGAL_NOTICE }">Mentions légales</router-link>
        <router-link :to="{ name: ROUTE_NAMES.LEGAL_TERMS }">CGU</router-link>
        <router-link :to="{ name: ROUTE_NAMES.LEGAL_PRIVACY }">Politique de confidentialité</router-link>
        <router-link :to="{ name: ROUTE_NAMES.LEGAL_COOKIES }">Cookies</router-link>
      </div>
    </footer>
  </div>
</template>
