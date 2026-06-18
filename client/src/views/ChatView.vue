<template>
  <div class="chat-view">
    <SessionHeader />
    <ChatPanel />
    <ChatInput />
    <ReportModal v-if="showReport" @close="showReport = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSession } from '../composables/useSession'
import SessionHeader from '../components/SessionHeader.vue'
import ChatPanel from '../components/ChatPanel.vue'
import ChatInput from '../components/ChatInput.vue'
import ReportModal from '../components/ReportModal.vue'

const { report, currentPhase } = useSession()
const showReport = ref(false)

watch(currentPhase, (phase) => {
  if (phase === 'completed' && report.value) {
    showReport.value = true
  }
})
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0 16px;
}
</style>