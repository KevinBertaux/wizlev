<script setup>
import { computed } from 'vue';

const props = defineProps({
  message: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: 'info',
  },
});

const toneClass = computed(() => {
  if (props.tone === 'success') {
    return 'admin-status-success';
  }
  if (props.tone === 'warning') {
    return 'admin-status-warning';
  }
  if (props.tone === 'error') {
    return 'admin-status-error';
  }
  return 'admin-status-info';
});
</script>

<template>
  <p v-if="message" class="admin-status" :class="toneClass">{{ message }}</p>
</template>

<style scoped>
.admin-status {
  margin: 12px 0 0;
  font-weight: 700;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid transparent;
}

.admin-status-success {
  color: var(--tone-success-fg);
  background: var(--tone-success-bg);
  border-color: var(--tone-success-border);
}

.admin-status-error {
  color: var(--tone-error-fg);
  background: var(--tone-error-bg);
  border-color: var(--tone-error-border);
}

.admin-status-info {
  color: var(--tone-info-fg);
  background: var(--tone-info-bg);
  border-color: var(--tone-info-border);
}

.admin-status-warning {
  color: var(--tone-warning-fg);
  background: var(--tone-warning-bg);
  border-color: var(--tone-warning-border);
}
</style>
