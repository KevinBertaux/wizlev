<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

function onSelect(value) {
  emit('update:modelValue', String(value));
}
</script>

<template>
  <div class="segmented-field">
    <p v-if="label" class="segmented-label">{{ label }}</p>
    <div class="segmented-control" role="radiogroup" :aria-label="ariaLabel || label">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="segment-btn"
        :class="{ 'is-active': modelValue === String(option.value) }"
        :aria-pressed="modelValue === String(option.value)"
        @click="onSelect(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.segmented-field {
  display: grid;
  gap: 6px;
}

.segmented-label {
  margin: 0 0 2px;
  font-weight: 700;
}

.segmented-control {
  display: flex;
  border: 1px solid #9bb9d3;
  border-radius: 12px;
  overflow: hidden;
  background: #f3faff;
}

.segment-btn {
  border: 0;
  border-right: 1px solid #9bb9d3;
  background: transparent;
  color: #1d4b6a;
  font-weight: 700;
  padding: 10px 10px;
  min-height: 44px;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.segment-btn:last-child {
  border-right: 0;
}

.segment-btn:hover,
.segment-btn:focus-visible {
  background: #deefff;
}

.segment-btn.is-active {
  color: var(--ink-inverse);
  background: var(--btn-secondary-grad);
}
</style>
