<template>
  <section class="page-block section-block">
    <h1>🗣️ Langues</h1>
    <p class="intro">Choisis une langue pour démarrer.</p>

    <div class="cards-grid">
      <router-link class="home-card" :to="{ name: 'languages-english' }">
        <h2>🇬🇧 Anglais</h2>
        <p>Apprends l'anglais avec des listes, des flashcards et la lecture à voix haute.</p>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.intro {
  margin-top: 0;
  margin-bottom: 12px;
}

.cards-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr);
}

.home-card {
  display: block;
  border: 1px solid #bfd1e8;
  border-radius: 14px;
  padding: 16px;
  background: linear-gradient(150deg, #fbfdff 0%, #f2f8ff 100%);
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.1);
}

.home-card h2 {
  margin: 0 0 8px;
}

.home-card p {
  margin: 0;
  color: #34465d;
  line-height: 1.45;
}

.home-card:hover,
.home-card:focus-visible {
  border-color: #2f4e6f;
  background: linear-gradient(150deg, #f7fbff 0%, #e9f3ff 100%);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.14);
  transform: translateY(-2px);
}

.home-card:active {
  transform: translateY(0);
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.12);
}
</style>
