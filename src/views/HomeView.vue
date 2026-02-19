<template>
  <section class="page-block">
    <h1>Plateforme de révision</h1>
    <p>
      Nouvelle base Vue/Vite prête pour la montée en charge (math avancé, langues).
    </p>

    <div class="grid-cards">
      <router-link class="card-link" to="/math">
        <h2>Math</h2>
        <p>Tables, divisions, symétrie (à étendre).</p>
      </router-link>

      <router-link class="card-link" to="/vocab">
        <h2>Langues</h2>
        <p>Anglais maintenant, espagnol ensuite.</p>
      </router-link>
    </div>
  </section>
</template>
