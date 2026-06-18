<template>
  <div class="phase-indicator" v-if="currentPhase">
    <div class="steps">
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="step"
        :class="{ active: step.active, done: step.done }"
      >
        <span class="step-dot">{{ step.done ? '✓' : idx + 1 }}</span>
        <span class="step-label">{{ step.label }}</span>
        <span v-if="idx < steps.length - 1" class="step-line"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSession } from '../composables/useSession'

const { currentPhase } = useSession()

const phaseOrder = ['identification', 'interview', 'debate', 'report', 'completed']

const steps = computed(() => {
  const labels: Record<string, string> = {
    identification: '识别',
    interview: '访谈',
    debate: '辩论',
    report: '报告',
    completed: '报告',
  }

  const currentIdx = phaseOrder.indexOf(currentPhase.value)

  return phaseOrder.slice(0, 4).map((phase, idx) => ({
    label: labels[phase],
    active: idx === currentIdx,
    done: idx < currentIdx,
  }))
})
</script>

<style scoped>
.phase-indicator {
  padding: 8px 0;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.step {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
  position: relative;
}

.step.active {
  color: #a78bfa;
}

.step.done {
  color: #4ade80;
}

.step-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.step.active .step-dot {
  background: rgba(167, 139, 250, 0.2);
  border-color: #a78bfa;
  color: #a78bfa;
}

.step.done .step-dot {
  background: rgba(74, 222, 128, 0.2);
  border-color: #4ade80;
  color: #4ade80;
}

.step-line {
  width: 32px;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
}

.step.done .step-line {
  background: rgba(74, 222, 128, 0.3);
}

.step-label {
  display: none;
}
</style>