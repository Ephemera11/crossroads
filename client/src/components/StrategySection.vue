<template>
  <div class="strategy-section" v-if="content">
    <h3>🗺️ 分阶段策略</h3>
    <p>{{ content }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ content?: string }>()
</script>

<style scoped>
.strategy-section {
  background: rgba(74, 158, 255, 0.06);
  border: 1px solid rgba(74, 158, 255, 0.15);
  border-radius: 12px;
  padding: 16px 20px;
}

.strategy-section h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #4a9eff;
  margin-bottom: 8px;
}

.strategy-section p {
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  white-space: pre-line;
}
</style>