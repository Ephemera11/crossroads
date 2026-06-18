<template>
  <header class="session-header" v-if="classification">
    <div class="header-content">
      <h1 class="title">{{ classification.title || '人生十字路口' }}</h1>
      <div class="meta">
        <span class="phase-badge" :class="currentPhase">
          {{ phaseLabel }}
        </span>
        <span class="expert-tags" v-if="expertNames.length">
          <span v-for="(name, i) in expertNames" :key="i" class="expert-tag" :style="{ borderColor: expertColors[i] }">
            {{ name }}
          </span>
        </span>
      </div>
    </div>
  </header>
  <header class="session-header placeholder" v-else>
    <div class="header-content">
      <h1 class="title">人生十字路口</h1>
      <p class="subtitle">AI 决策教练</p>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSession } from '../composables/useSession'

const { classification, currentPhase, expertNames } = useSession()

const expertColors = ['#4a9eff', '#4ade80', '#fbbf24', '#f472b6', '#a78bfa']

const phaseLabel = computed(() => {
  const labels: Record<string, string> = {
    identification: '识别中',
    interview: '专家访谈',
    debate: '专家辩论',
    report: '生成报告',
    completed: '已完成',
  }
  return labels[currentPhase.value] || currentPhase.value
})
</script>

<style scoped>
.session-header {
  padding: 20px 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.placeholder .title {
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.phase-badge {
  font-size: 0.7rem;
  padding: 2px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.phase-badge.interview {
  background: rgba(74, 158, 255, 0.15);
  color: #4a9eff;
}

.phase-badge.debate {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.phase-badge.report {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.expert-tags {
  display: flex;
  gap: 6px;
}

.expert-tag {
  font-size: 0.65rem;
  padding: 1px 8px;
  border-radius: 10px;
  border: 1px solid;
  color: rgba(255, 255, 255, 0.7);
}
</style>