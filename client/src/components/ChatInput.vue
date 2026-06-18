<template>
  <div class="chat-input">
    <div class="input-wrapper">
      <textarea
        ref="inputRef"
        v-model="inputText"
        :placeholder="placeholder"
        :disabled="isStreaming"
        @keydown.enter.exact.prevent="handleSend"
        rows="1"
      ></textarea>
      <button
        class="send-btn"
        :disabled="!inputText.trim() || isStreaming"
        @click="handleSend"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSession } from '../composables/useSession'

const { currentPhase, isStreaming, createSession, sendMessage } = useSession()
const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement>()

const placeholder = computed(() => {
  if (isStreaming.value) return '正在思考...'
  const labels: Record<string, string> = {
    identification: '说说你的纠结吧...',
    interview: '输入你的回答...',
    debate: '说说你的想法...',
    report: '报告已生成',
    completed: '决策已完成',
  }
  return labels[currentPhase.value] || '输入...'
})

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  inputText.value = ''

  if (currentPhase.value === 'identification') {
    await createSession(text)
  } else {
    await sendMessage(text)
  }
}
</script>

<style scoped>
.chat-input {
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 8px 12px;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: rgba(167, 139, 250, 0.4);
}

textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e0e0e0;
  font-size: 0.9rem;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  line-height: 1.4;
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

textarea:disabled {
  opacity: 0.5;
}

.send-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
}

.send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>