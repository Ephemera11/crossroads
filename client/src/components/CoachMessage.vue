<template>
  <div class="coach-message">
    <div class="avatar">🧭</div>
    <div class="content" v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '../types'

const props = defineProps<{ message: Message }>()

const renderedContent = computed(() => {
  // Simple markdown-like rendering
  let text = props.message.content
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\n\n/g, '<br><br>')
  text = text.replace(/\n/g, '<br>')
  text = text.replace(/> (.+)/g, '<span class="quote">$1</span>')
  return text
})
</script>

<style scoped>
.coach-message {
  display: flex;
  gap: 10px;
  padding: 0 4px;
}

.avatar {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(167, 139, 250, 0.15);
  border-radius: 50%;
}

.content {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.9rem;
  line-height: 1.6;
  max-width: 80%;
  color: rgba(255, 255, 255, 0.85);
}

.content :deep(strong) {
  color: #a78bfa;
  font-weight: 600;
}

.content :deep(.quote) {
  display: block;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  padding-left: 12px;
  border-left: 2px solid rgba(255, 255, 255, 0.15);
  margin: 4px 0;
}
</style>