<template>
  <div class="user-message">
    <div class="bubble">{{ message.content }}</div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '../types'

defineProps<{ message: Message }>()
</script>

<style scoped>
.user-message {
  display: flex;
  justify-content: flex-end;
  padding: 0 4px;
}

.bubble {
  max-width: 75%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  padding: 10px 16px;
  border-radius: 18px 18px 4px 18px;
  font-size: 0.9rem;
  line-height: 1.5;
}
</style>