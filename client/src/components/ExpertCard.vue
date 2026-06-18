<template>
  <div class="expert-card" :class="expertColorClass">
    <div class="expert-header">
      <span class="expert-avatar" :style="{ background: expertColor }">{{ expertIcon }}</span>
      <div class="expert-info">
        <span class="expert-name">{{ expertName }}</span>
        <span class="expert-role">{{ expertRole }}</span>
      </div>
    </div>
    <div class="expert-content" v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '../types'

const props = defineProps<{ message: Message }>()

const expertColors: Record<string, string> = {
  career_advisor: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  lifestyle_coach: 'linear-gradient(135deg, #22c55e, #16a34a)',
  financial_planner: 'linear-gradient(135deg, #f59e0b, #d97706)',
  relationship_coach: 'linear-gradient(135deg, #ec4899, #db2777)',
  education_planner: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
}

const expertIcons: Record<string, string> = {
  career_advisor: '💼',
  lifestyle_coach: '🌿',
  financial_planner: '💰',
  relationship_coach: '💝',
  education_planner: '📚',
}

const expertColorClass = computed(() => {
  return props.message.expertRole || 'career_advisor'
})

const expertColor = computed(() => {
  return expertColors[props.message.expertRole || ''] || 'linear-gradient(135deg, #6366f1, #4f46e5)'
})

const expertIcon = computed(() => {
  return expertIcons[props.message.expertRole || ''] || '🎯'
})

const expertName = computed(() => {
  const names: Record<string, string> = {
    career_advisor: '职业发展顾问',
    lifestyle_coach: '生活方式教练',
    financial_planner: '财务规划师',
    relationship_coach: '情感关系教练',
    education_planner: '教育规划师',
  }
  return names[props.message.expertRole || ''] || '专家'
})

const expertRole = computed(() => {
  return props.message.expertRole || ''
})

const renderedContent = computed(() => {
  let text = props.message.content
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\n\n/g, '<br><br>')
  text = text.replace(/\n/g, '<br>')
  return text
})
</script>

<style scoped>
.expert-card {
  padding: 0 4px;
  margin: 4px 0;
}

.expert-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.expert-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.expert-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.expert-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.expert-role {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
}

.expert-content {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-left: 3px solid rgba(255, 255, 255, 0.15);
  padding: 12px 16px;
  border-radius: 0 12px 12px 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 42px;
}

.expert-content :deep(strong) {
  color: #fbbf24;
  font-weight: 600;
}
</style>