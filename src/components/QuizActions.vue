<script setup>
defineProps({
  state: {
    type: String,
    default: 'check',
    validator: (value) => ['check', 'next', 'none'].includes(value),
  },
  canCheck: {
    type: Boolean,
    default: true,
  },
  checkLabel: {
    type: String,
    default: 'Vérifier ✓',
  },
  nextLabel: {
    type: String,
    default: 'Question suivante →',
  },
});

defineEmits(['check', 'next']);
</script>

<template>
  <div v-if="state !== 'none'" class="mp-actions">
    <button
      v-if="state === 'check'"
      class="mp-btn mp-btn-primary"
      type="button"
      :disabled="!canCheck"
      @click="$emit('check')"
    >
      {{ checkLabel }}
    </button>
    <button v-else class="mp-btn mp-btn-secondary" type="button" @click="$emit('next')">
      {{ nextLabel }}
    </button>
  </div>
</template>
