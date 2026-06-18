<template>
  <div class="conflict-section" v-if="content">
    <h3>⚡ 核心矛盾</h3>
    <p>{{ content }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ content?: string }>()
</script>

<style scoped>
.conflict-section {
  background: rgba(251, 191, 36, 0.06);
  border: 1px solid rgba(251, 191, 36, 0.15);
  border-radius: 12px;
  padding: 16px 20px;
}

.conflict-section h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fbbf24;
  margin-bottom: 8px;
}

.conflict-section p {
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
}
</style>