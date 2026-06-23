import { reactive, computed } from 'vue';
import type { Message, Session, Phase, Report, DecisionClassification } from '../types';

// Polyfill for crypto.randomUUID in non-secure contexts
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface State {
  session: Session | null;
  messages: Message[];
  currentPhase: Phase;
  isStreaming: boolean;
  error: string | null;
  report: Report | null;
  classification: DecisionClassification | null;
}

const state = reactive<State>({
  session: null,
  messages: [],
  currentPhase: 'identification',
  isStreaming: false,
  error: null,
  report: null,
  classification: null,
});

// Debug: expose state globally
if (typeof window !== 'undefined') {
  (window as any).__debugState = state;
}

export function useSession() {
  const expertNames = computed(() => {
    if (!state.classification) return [];
    return state.classification.recommendedExperts.map(e => e.name);
  });

  const sessionId = computed(() => state.session?.id);

  async function createSession(message: string) {
    state.isStreaming = true;
    state.error = null;

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error('Failed to create session');

      const data = await res.json();
      state.session = { id: data.sessionId, status: 'active', messages: [], experts: [] };
      state.classification = data.classification;
      state.currentPhase = 'interview';

      const newMessages = data.messages.map((msg: any) => ({
        id: generateId(),
        sessionId: data.sessionId,
        role: msg.role,
        expertRole: msg.expertRole,
        phase: 'interview',
        content: msg.content,
        createdAt: new Date().toISOString(),
      }));
      state.messages = [...state.messages, ...newMessages];
      console.log('[useSession] messages set:', state.messages.length, 'messages');
      console.log('[useSession] state.messages is array:', Array.isArray(state.messages));

      connectSSE(data.sessionId);
    } catch (e: any) {
      state.error = e.message;
    } finally {
      state.isStreaming = false;
    }
  }

  async function sendMessage(message: string) {
    if (!state.session) return;

    state.isStreaming = true;
    state.error = null;

    state.messages = [...state.messages, {
      id: generateId(),
      sessionId: state.session.id,
      role: 'user',
      phase: state.currentPhase,
      content: message,
      createdAt: new Date().toISOString(),
    }];

    try {
      const res = await fetch(`/api/sessions/${state.session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();

      const newMsgs = data.messages.map((msg: any) => ({
        id: generateId(),
        sessionId: state.session!.id,
        role: msg.role,
        expertRole: msg.expertRole,
        phase: data.phase,
        content: msg.content,
        createdAt: new Date().toISOString(),
      }));
      state.messages = [...state.messages, ...newMsgs];

      state.currentPhase = data.phase;

      if (data.report) {
        state.report = data.report;
      }
    } catch (e: any) {
      state.error = e.message;
    } finally {
      state.isStreaming = false;
    }
  }

  function connectSSE(sid: string) {
    const eventSource = new EventSource(`/api/sessions/${sid}/stream`);

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'messages' && data.messages) {
          for (const msg of data.messages) {
            const exists = state.messages.find(
              m => m.content === msg.content && m.role === msg.role
            );
            if (!exists) {
              state.messages = [...state.messages, {
                id: generateId(),
                sessionId: sid,
                role: msg.role,
                expertRole: msg.expertRole,
                phase: data.phase,
                content: msg.content,
                createdAt: new Date().toISOString(),
              }];
            }
          }
          state.currentPhase = data.phase;
          if (data.report) {
            state.report = data.report;
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
    state.session = null;
    state.messages = [];
    state.currentPhase = 'identification';
    state.report = null;
    state.classification = null;
    state.error = null;
    state.isStreaming = false;
  }

  return {
    state,
    expertNames,
    sessionId,
    createSession,
    sendMessage,
    reset,
  };
}