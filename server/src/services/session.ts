import prisma from '../store';
import { DeepSeekProvider, DecisionClassification, ExpertAnalysis, DebateResult, DecisionReport } from '../llm';
import { classifyDecision } from '../agents/decision-classifier';
import { askExpertQuestion, summarizeExpertAnalysis } from '../agents/expert-interviewer';
import { runDebate, askCoachQuestion } from '../agents/debate-moderator';
import { generateReport } from '../agents/report-generator';

const llm = new DeepSeekProvider();

export type Phase = 'identification' | 'interview' | 'debate' | 'report' | 'completed';

interface SessionState {
  phase: Phase;
  decisionType: string;
  options: string[];
  expertRoles: { role: string; name: string }[];
  currentExpertIndex: number;
  expertRound: number; // 0 = asking questions, 1 = summary
  expertConversations: Record<string, { question: string; answer: string }[]>;
  expertAnalyses: ExpertAnalysis[];
  debateResult: DebateResult | null;
  report: DecisionReport | null;
}

// In-memory session state store
const sessionStates = new Map<string, SessionState>();

export function getSessionState(sessionId: string): SessionState | undefined {
  return sessionStates.get(sessionId);
}

export async function createSession(userMessage: string): Promise<{
  sessionId: string;
  classification: DecisionClassification;
  coachMessage: string;
}> {
  // Phase 1: Classify decision
  const classification = await classifyDecision(llm, userMessage);

  // Create session in DB
  const session = await prisma.session.create({
    data: {
      title: classification.title,
      decisionType: classification.decisionType,
    },
  });

  // Save user message
  await prisma.message.create({
    data: {
      sessionId: session.id,
      role: 'user',
      phase: 'identification',
      content: userMessage,
    },
  });

  // Save experts
  const experts = classification.recommendedExperts.slice(0, 3);
  for (const expert of experts) {
    await prisma.expert.create({
      data: {
        sessionId: session.id,
        role: expert.role,
        name: expert.name,
      },
    });
  }

  // Coach message
  const expertNames = experts.map(e => e.name).join('、');
  const coachMessage = `这是一个${classification.decisionType === 'career' ? '职业' : classification.decisionType === 'lifestyle' ? '生活' : ''}决策。我为你召唤三位专家：${expertNames}。他们将从各自的专业角度帮你分析。`;

  await prisma.message.create({
    data: {
      sessionId: session.id,
      role: 'coach',
      phase: 'identification',
      content: coachMessage,
    },
  });

  // Initialize session state
  sessionStates.set(session.id, {
    phase: 'interview',
    decisionType: classification.decisionType,
    options: classification.options,
    expertRoles: experts.map(e => ({ role: e.role, name: e.name })),
    currentExpertIndex: 0,
    expertRound: 0,
    expertConversations: {},
    expertAnalyses: [],
    debateResult: null,
    report: null,
  });

  return {
    sessionId: session.id,
    classification,
    coachMessage,
  };
}

export async function processUserMessage(
  sessionId: string,
  userMessage: string
): Promise<{
  phase: Phase;
  messages: { role: string; content: string; expertRole?: string; expertName?: string }[];
  report?: DecisionReport;
}> {
  const state = sessionStates.get(sessionId);
  if (!state) throw new Error('Session not found');

  // Save user message
  await prisma.message.create({
    data: {
      sessionId,
      role: 'user',
      phase: state.phase,
      content: userMessage,
    },
  });

  const responseMessages: { role: string; content: string; expertRole?: string; expertName?: string }[] = [];

  if (state.phase === 'interview') {
    // Get the current expert
    const currentExpert = state.expertRoles[state.currentExpertIndex];
    if (!currentExpert) {
      // All experts done, move to debate
      state.phase = 'debate';
      return await handleDebatePhase(sessionId, state, responseMessages);
    }

    const convKey = currentExpert.role;

    if (state.expertRound === 0) {
      // Expert asks first question
      const question = await askExpertQuestion(llm, currentExpert.role, currentExpert.name, '', []);

      state.expertConversations[convKey] = [{ question, answer: userMessage }];

      await prisma.message.create({
        data: {
          sessionId,
          role: 'expert',
          expertRole: currentExpert.role,
          phase: 'interview',
          content: question,
        },
      });

      responseMessages.push({
        role: 'expert',
        content: question,
        expertRole: currentExpert.role,
        expertName: currentExpert.name,
      });

      state.expertRound = 1;
    } else {
      // Expert has asked first question, user answered, now ask second question or summarize
      const conversation = state.expertConversations[convKey] || [];
      conversation[conversation.length - 1].answer = userMessage;

      // Get user context for this expert
      const userContext = await buildUserContext(sessionId);

      const secondQuestion = await askExpertQuestion(
        llm,
        currentExpert.role,
        currentExpert.name,
        userContext,
        conversation
      );

      // Check if it's a question or a summary (heuristic: if it contains "?", it's a question)
      if (secondQuestion.includes('？') || secondQuestion.includes('?')) {
        conversation.push({ question: secondQuestion, answer: '' });
        state.expertConversations[convKey] = conversation;

        await prisma.message.create({
          data: {
            sessionId,
            role: 'expert',
            expertRole: currentExpert.role,
            phase: 'interview',
            content: secondQuestion,
          },
        });

        responseMessages.push({
          role: 'expert',
          content: secondQuestion,
          expertRole: currentExpert.role,
          expertName: currentExpert.name,
        });
      } else {
        // This is likely a summary, move to next expert
        await saveExpertSummary(sessionId, currentExpert.role, secondQuestion);
        responseMessages.push({
          role: 'expert',
          content: secondQuestion,
          expertRole: currentExpert.role,
          expertName: currentExpert.name,
        });

        state.currentExpertIndex++;
        state.expertRound = 0;

        // Check if there are more experts
        if (state.currentExpertIndex < state.expertRoles.length) {
          const nextExpert = state.expertRoles[state.currentExpertIndex];
          const firstQuestion = await askExpertQuestion(llm, nextExpert.role, nextExpert.name, await buildUserContext(sessionId), []);

          state.expertConversations[nextExpert.role] = [{ question: firstQuestion, answer: '' }];
          state.expertRound = 1;

          await prisma.message.create({
            data: {
              sessionId,
              role: 'expert',
              expertRole: nextExpert.role,
              phase: 'interview',
              content: firstQuestion,
            },
          });

          responseMessages.push({
            role: 'expert',
            content: firstQuestion,
            expertRole: nextExpert.role,
            expertName: nextExpert.name,
          });
        } else {
          // All experts done, start debate
          state.phase = 'debate';
          return await handleDebatePhase(sessionId, state, responseMessages);
        }
      }
    }
  } else if (state.phase === 'debate') {
    // User feedback on debate
    const coachResponse = await askCoachQuestion(
      llm,
      await buildUserContext(sessionId),
      state.debateResult!,
      userMessage
    );

    await prisma.message.create({
      data: {
        sessionId,
        role: 'coach',
        phase: 'debate',
        content: coachResponse,
      },
    });

    responseMessages.push({ role: 'coach', content: coachResponse });

    // After debate feedback, generate report
    state.phase = 'report';
    return await handleReportPhase(sessionId, state, responseMessages);
  }

  return { phase: state.phase, messages: responseMessages };
}

async function handleDebatePhase(
  sessionId: string,
  state: SessionState,
  responseMessages: { role: string; content: string; expertRole?: string; expertName?: string }[]
): Promise<{
  phase: Phase;
  messages: { role: string; content: string; expertRole?: string; expertName?: string }[];
  report?: DecisionReport;
}> {
  // Summarize all experts first
  const userContext = await buildUserContext(sessionId);

  for (const expert of state.expertRoles) {
    const conv = state.expertConversations[expert.role] || [];
    if (conv.length > 0) {
      const analysis = await summarizeExpertAnalysis(
        llm,
        expert.role,
        expert.name,
        userContext,
        conv,
        state.options
      );
      state.expertAnalyses.push(analysis);

      await prisma.expert.updateMany({
        where: { sessionId, role: expert.role },
        data: {
          summary: analysis.summary,
          score: JSON.stringify(analysis.score),
        },
      });
    }
  }

  // Run debate
  const debateResult = await runDebate(llm, userContext, state.options, state.expertAnalyses);
  state.debateResult = debateResult;

  // Build debate message
  const debateMessage = buildDebateText(debateResult);

  await prisma.message.create({
    data: {
      sessionId,
      role: 'coach',
      phase: 'debate',
      content: debateMessage,
    },
  });

  responseMessages.push({ role: 'coach', content: debateMessage });

  return { phase: 'debate', messages: responseMessages };
}

async function handleReportPhase(
  sessionId: string,
  state: SessionState,
  responseMessages: { role: string; content: string; expertRole?: string; expertName?: string }[]
): Promise<{
  phase: Phase;
  messages: { role: string; content: string; expertRole?: string; expertName?: string }[];
  report?: DecisionReport;
}> {
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  const fullHistory = messages
    .map(m => `[${m.role}${m.expertRole ? '/' + m.expertRole : ''}] ${m.content}`)
    .join('\n');

  const report = await generateReport(
    llm,
    await buildUserContext(sessionId),
    state.options,
    state.expertAnalyses,
    state.debateResult!,
    fullHistory
  );

  // Save report
  await prisma.report.create({
    data: {
      sessionId,
      scoresJson: report.scoresJson,
      coreConflict: report.coreConflict,
      strategy: report.strategy,
      actionItems: report.actionItems,
    },
  });

  await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'completed' },
  });

  state.phase = 'completed';
  state.report = report;

  const reportSummary = '📊 决策报告已生成！请查看详细分析。';

  await prisma.message.create({
    data: {
      sessionId,
      role: 'coach',
      phase: 'report',
      content: reportSummary,
    },
  });

  responseMessages.push({ role: 'coach', content: reportSummary });

  return { phase: 'completed', messages: responseMessages, report };
}

function buildDebateText(debate: DebateResult): string {
  let text = '## 🏛️ 专家圆桌辩论\n\n';

  for (const opinion of debate.expertOpinions) {
    text += `**${opinion.expert}**：倾向「${opinion.stance}」（评分：${opinion.score}/10）\n> ${opinion.reasoning}\n\n`;
  }

  text += `### ✅ 共识\n${debate.consensus}\n\n`;
  text += `### ⚡ 分歧\n${debate.divergence}\n\n`;
  text += `### 🤔 ${debate.coachQuestion}`;

  return text;
}

async function buildUserContext(sessionId: string): Promise<string> {
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  return messages
    .map(m => `[${m.role}${m.expertRole ? '/' + m.expertRole : ''}] ${m.content}`)
    .join('\n');
}

async function saveExpertSummary(sessionId: string, expertRole: string, summary: string) {
  await prisma.message.create({
    data: {
      sessionId,
      role: 'expert',
      expertRole,
      phase: 'interview',
      content: summary,
    },
  });
}