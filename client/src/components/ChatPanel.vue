<template>
  <div class="chat-panel" ref="panelRef">
    <div class="messages" v-if="hasMessages">
      <template v-for="msg in state.messages" :key="msg.id">
        <UserMessage v-if="msg.role === 'user'" :message="msg" />
        <CoachMessage v-else-if="msg.role === 'coach'" :message="msg" />
        <ExpertCard v-else-if="msg.role === 'expert'" :message="msg" />
      </template>
    </div>
    <div class="welcome" v-else>
      <div class="welcome-icon">🧭</div>
      <h2>人生十字路口</h2>
      <p>说出你的纠结，让 AI 教练召唤专家团队帮你理清思路</p>
      <div class="examples">
        <span class="label">试试看：</span>
        <button class="example-btn" @click="handleExample('我纠结要不要从上海回成都发展')">
          要不要从上海回成都
        </button>
        <button class="example-btn" @click="handleExample('我该继续读研还是直接工作？')">
          读研还是工作
        </button>
        <button class="example-btn" @click="handleExample('我该不该和现在的伴侣继续走下去')">
          感情要不要继续
        </button>
      </div>
    </div>
    <div v-if="state.isStreaming" class="streaming-indicator">
      <span class="dot"></span> 思考中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useSession } from '../composables/useSession'
import UserMessage from './UserMessage.vue'
import CoachMessage from './CoachMessage.vue'
import ExpertCard from './ExpertCard.vue'

const { state, createSession } = useSession()
const panelRef = ref<HTMLDivElement>()

const hasMessages = computed(() => {
  console.log('[ChatPanel] hasMessages computed:', state.messages.length)
  return state.messages.length > 0
})

async function handleExample(text: string) {
  await createSession(text)
}

watch(
  () => state.messages.length,
  async () => {
    await nextTick()
    if (panelRef.value) {
      panelRef.value.scrollTop = panelRef.value.scrollHeight
    }
  }
)
</script>

<style scoped>
.chat-panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  gap: 12px;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 8px;
}

.welcome h2 {
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  max-width: 320px;
}

.examples {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.label {
  width: 100%;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
}

.example-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.example-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
}

.dot {
  width: 8px;
  height: 8px;
  background: #a78bfa;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
</style>