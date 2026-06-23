import { Router, Request, Response } from 'express';
import prisma from '../store';
import { createSession, processUserMessage, getSessionState } from '../services/session';
import { DeepSeekProvider } from '../llm';
import { askExpertQuestion } from '../agents/expert-interviewer';

const router = Router();
const llm = new DeepSeekProvider();

// Create a new session
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const { sessionId, classification, coachMessage } = await createSession(message);

    // Generate first expert's question
    const state = getSessionState(sessionId);
    let firstExpertMessage = null;
    if (state && state.expertRoles.length > 0) {
      const firstExpert = state.expertRoles[0];
      const question = await askExpertQuestion(llm, firstExpert.role, firstExpert.name, message, []);
      
      // Store the question in session state
      state.expertConversations[firstExpert.role] = [{ question, answer: '' }];
      state.expertRound = 1;

      // Save to DB
      await prisma.message.create({
        data: {
          sessionId,
          role: 'expert',
          expertRole: firstExpert.role,
          phase: 'interview',
          content: question,
        },
      });

      firstExpertMessage = {
        role: 'expert',
        content: question,
        expertRole: firstExpert.role,
        expertName: firstExpert.name,
      };
    }

    res.json({
      sessionId,
      classification,
      messages: [
        { role: 'coach', content: coachMessage },
        ...(firstExpertMessage ? [firstExpertMessage] : []),
      ],
    });
  } catch (error: any) {
    console.error('Create session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        experts: true,
        report: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message (triggers phase progression)
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const result = await processUserMessage(req.params.id, message);

    // Also emit via SSE if any clients are listening
    if (global.sseClients?.has(req.params.id)) {
      const clients = global.sseClients.get(req.params.id)!;
      for (const client of clients) {
        client.write(`data: ${JSON.stringify({ type: 'messages', ...result })}\n\n`);
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error('Process message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// SSE stream endpoint
router.get('/:id/stream', (req: Request, res: Response) => {
  const sessionId = req.params.id;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // Add client to SSE clients
  if (!global.sseClients) {
    global.sseClients = new Map();
  }
  if (!global.sseClients.has(sessionId)) {
    global.sseClients.set(sessionId, new Set());
  }
  global.sseClients.get(sessionId)!.add(res);

  req.on('close', () => {
    const clients = global.sseClients?.get(sessionId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        global.sseClients!.delete(sessionId);
      }
    }
  });
});

// Get report
router.get('/:id/report', async (req: Request, res: Response) => {
  try {
    const report = await prisma.report.findUnique({
      where: { sessionId: req.params.id },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List sessions
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });

    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;