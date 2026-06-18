import { ref, computed } from 'vue';
import type { Message, Session, Phase, Report, DecisionClassification } from '../types';

const session = ref<Session | null>(null);
const messages = ref<Message[]>([]);
const currentPhase = ref<Phase>('identification');
const isStreaming = ref(false);
const error = ref<string | null>(null);
const report = ref<Report | null>(null);
const classification = ref<DecisionClassification | null>(null);

export function useSession() {
  const expertNames = computed(() => {
    if (!classification.value) return [];
    return classification.value.recommendedExperts.map(e => e.name);
  });

  const sessionId = computed(() => session.value?.id);

  async function createSession(message: string) {
    isStreaming.value = true;
    error.value = null;

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error('Failed to create session');

      const data = await res.json();
      session.value = { id: data.sessionId, status: 'active', messages: [], experts: [] };
      classification.value = data.classification;
      currentPhase.value = 'interview';

      // Add coach and first expert messages
      for (const msg of data.messages) {
        messages.value.push({
          id: crypto.randomUUID(),
          sessionId: data.sessionId,
          role: msg.role,
          expertRole: msg.expertRole,
          phase: 'interview',
          content: msg.content,
          createdAt: new Date().toISOString(),
        });
      }

      // Start SSE connection
      connectSSE(data.sessionId);
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isStreaming.value = false;
    }
  }

  async function sendMessage(message: string) {
    if (!session.value) return;

    isStreaming.value = true;
    error.value = null;

    // Add user message immediately
    messages.value.push({
      id: crypto.randomUUID(),
      sessionId: session.value.id,
      role: 'user',
      phase: currentPhase.value,
      content: message,
      createdAt: new Date().toISOString(),
    });

    try {
      const res = await fetch(`/api/sessions/${session.value.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();

      for (const msg of data.messages) {
        messages.value.push({
          id: crypto.randomUUID(),
          sessionId: session.value!.id,
          role: msg.role,
          expertRole: msg.expertRole,
          phase: data.phase,
          content: msg.content,
          createdAt: new Date().toISOString(),
        });
      }

      currentPhase.value = data.phase;

      if (data.report) {
        report.value = data.report;
      }
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isStreaming.value = false;
    }
  }

  function connectSSE(sid: string) {
    const eventSource = new EventSource(`/api/sessions/${sid}/stream`);

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'messages' && data.messages) {
          for (const msg of data.messages) {
            // Avoid duplicates
            const exists = messages.value.find(
              m => m.content === msg.content && m.role === msg.role
            );
            if (!exists) {
              messages.value.push({
                id: crypto.randomUUID(),
                sessionId: sid,
                role: msg.role,
                expertRole: msg.expertRole,
                phase: data.phase,
                content: msg.content,
                createdAt: new Date().toISOString(),
              });
            }
          }
          currentPhase.value = data.phase;
          if (data.report) {
            report.value = data.report;
          }
        }
      } catch {
        // ignore parse errors
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
    };
  }

  function reset() {
    session.value = null;
    messages.value = [];
    currentPhase.value = 'identification';
    report.value = null;
    classification.value = null;
    error.value = null;
    isStreaming.value = false;
  }

  return {
    session,
    messages,
    currentPhase,
    isStreaming,
    error,
    report,
    classification,
    expertNames,
    sessionId,
    createSession,
    sendMessage,
    reset,
  };
}