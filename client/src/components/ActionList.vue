<template>
  <div class="action-list" v-if="items.length">
    <h3>✅ 下一步行动清单</h3>
    <div class="items">
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="action-item"
        :class="item.priority"
      >
        <span class="priority-dot" :class="item.priority"></span>
        <div class="action-content">
          <span class="action-text">{{ item.action }}</span>
          <span class="action-time">{{ item.timeframe }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ActionItem } from '../types'

defineProps<{ items: ActionItem[] }>()
</script>

<style scoped>
.action-list {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px 20px;
}

.action-list h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 12px;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.priority-dot.high {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}

.priority-dot.medium {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.priority-dot.low {
  background: #6b7280;
}

.action-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}

.action-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 8px;
  border-radius: 8px;
  align-self: flex-start;
}
</style>