// ── Socket.io Health Check API Route ──
// Checks if the Socket.io realtime service is running by testing TCP connectivity

import { NextResponse } from 'next/server';
import net from 'net';

const REALTIME_SERVICE_PORT = process.env.NEXT_PUBLIC_SOCKET_PORT || '3003';
const REALTIME_SERVICE_HOST = 'localhost';

export async function GET() {
  try {
    // Check if the realtime service is reachable by attempting a TCP connection
    const isReachable = await checkPortReachable(REALTIME_SERVICE_HOST, parseInt(REALTIME_SERVICE_PORT, 10));

    if (isReachable) {
      return NextResponse.json({
        status: 'ok',
        service: 'kariako-guide-realtime',
        port: REALTIME_SERVICE_PORT,
        timestamp: new Date().toISOString(),
        message: 'Socket.io realtime service is running and accepting connections',
      });
    } else {
      return NextResponse.json(
        {
          status: 'offline',
          service: 'kariako-guide-realtime',
          port: REALTIME_SERVICE_PORT,
          timestamp: new Date().toISOString(),
          message: 'Realtime service is not reachable on port ' + REALTIME_SERVICE_PORT,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to check realtime service health',
        error: message,
        port: REALTIME_SERVICE_PORT,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function checkPortReachable(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 3000);

    socket.connect(port, host, () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });
  });
}
