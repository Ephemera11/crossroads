import { Request, Response } from 'express';

// Export SSE client map type
declare global {
  var sseClients: Map<string, Set<Response>> | undefined;
}

export function healthCheck(_req: Request, res: Response) {
  res.json({ status: 'ok', service: 'crossroads-server' });
}