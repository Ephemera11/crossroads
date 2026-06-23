<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="state.report" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h2>📊 决策报告</h2>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>
        <div class="modal-body">
          <ScoreChart v-if="scores.length" :scores="scores" />
          <ConflictSection :content="state.report.coreConflict" />
          <StrategySection :content="state.report.strategy" />
          <ActionList :items="actionItems" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSession } from '../composables/useSession'
import type { ScoreItem, ActionItem } from '../types'
import ScoreChart from './ScoreChart.vue'
import ConflictSection from './ConflictSection.vue'
import StrategySection from './StrategySection.vue'
import ActionList from './ActionList.vue'

const { state } = useSession()

defineEmits(['close'])

const scores = computed<ScoreItem[]>(() => {
  if (!state.report?.scoresJson) return []
  try {
    return JSON.parse(state.report.scoresJson)
  } catch {
    return []
  }
})

const actionItems = computed<ActionItem[]>(() => {
  if (!state.report?.actionItems) return []
  try {
    return JSON.parse(state.report.actionItems)
  } catch {
    return []
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  max-width: 700px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  background: inherit;
  border-radius: 20px 20px 0 0;
  z-index: 1;
}

.modal-header h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #e0e0e0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>