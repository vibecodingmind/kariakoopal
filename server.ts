// ── Chimbo Direct Platform - Custom Server ──
// Starts the Socket.io realtime service and the Next.js application
// This file is used by the `dev:server` script

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

async function main() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  server.listen(port, () => {
    console.log(`[Chimbo Server] Next.js app ready on http://${hostname}:${port}`);
    console.log(`[Chimbo Server] Socket.io realtime service runs separately on port 3003`);
    console.log(`[Chimbo Server] Use "bun run dev:server" to start both services`);
  });
}

main().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
