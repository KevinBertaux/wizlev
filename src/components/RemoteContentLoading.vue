<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="remote-loading-state" role="status" aria-live="polite">
    <div class="remote-loading-state__spinner" aria-hidden="true" />
    <p class="remote-loading-state__title">{{ title }}</p>
    <p class="remote-loading-state__message">{{ message }}</p>
  </div>
</template>

<style scoped>
.remote-loading-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  max-width: 420px;
  margin: 0 auto;
  padding: 24px 20px;
  border: 1px solid #d5e2ef;
  border-radius: 16px;
  background: linear-gradient(180deg, #fbfdff 0%, #f2f8ff 100%);
  text-align: center;
}

.remote-loading-state__spinner {
  width: 28px;
  height: 28px;
  border: 4px solid #d4e2f5;
  border-top-color: #4b7bd1;
  border-radius: 999px;
  animation: remote-loading-spin 0.8s linear infinite;
}

.remote-loading-state__title {
  margin: 0;
  font-weight: 800;
  color: #15304a;
}

.remote-loading-state__message {
  margin: 0;
  color: #5a6f86;
}

@keyframes remote-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
