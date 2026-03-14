<template>
  <section class="page-block section-block">
    <h1>🎨 Arts plastiques</h1>
    <p class="hub-intro">Choisis une activité créative pour démarrer.</p>

    <div class="cards-grid grid grid-cols-1 gap-4">
      <router-link class="home-card" :to="{ name: 'arts-drawing-guided' }">
        <h2>✏️ Dessin guidé</h2>
        <p>Observe chaque étape, dessine sur papier, puis avance jusqu'au résultat final.</p>
      </router-link>
    </div>
  </section>
</template>
