import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';

import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';
import { seedAdmin } from './seed/admin.js';
import { seedAmbulanceUnits } from './seed/ambulanceUnits.js';
import { verifyAccessToken } from './modules/auth/jwt.js';
import type { AuthContext, AuthRole } from './shared/types/http.js';

interface SocketData {
  auth?: AuthContext;
}

interface LegacyJoinPayload {
  type: 'user' | 'responder';
  id: string;
}

interface ResponderLocationPayload {
  responderId: string;
  latitude: number;
  longitude: number;
}

function autoJoinRooms(socket: Socket & { data: SocketData }, auth: AuthContext): void {
  const { accountId, role } = auth;
  if (role === 'user') socket.join(`user:${accountId}`);
  if (role === 'responder') socket.join(`responder:${accountId}`);
  if (role === 'admin') socket.join('admin:live');
}

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await seedAdmin();
  await seedAmbulanceUnits();

  const app = createApp();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth as Record<string, unknown>)?.token ??
      socket.handshake.query?.token;
    if (typeof token !== 'string' || !token) return next();
    try {
      const claims = verifyAccessToken(token);
      (socket.data as SocketData).auth = {
        accountId: claims.sub,
        email: claims.email,
        role: claims.role as AuthRole,
      };
      next();
    } catch {
      next();
    }
  });

  app.set('io', io);

  io.on('connection', (socket: Socket & { data: SocketData }) => {
    const auth = socket.data.auth;
    if (auth) autoJoinRooms(socket, auth);

    socket.on('join:emergency', (emergencyId: unknown) => {
      if (typeof emergencyId === 'string' && /^[a-f\d]{24}$/i.test(emergencyId)) {
        socket.join(`emergency:${emergencyId}`);
      }
    });

    socket.on('leave:emergency', (emergencyId: unknown) => {
      if (typeof emergencyId === 'string') {
        socket.leave(`emergency:${emergencyId}`);
      }
    });

    socket.on('join', (data: LegacyJoinPayload) => {
      socket.join(data.type);
      socket.join(data.id);
    });

    socket.on('responderLocation', (data: ResponderLocationPayload) => {
      io.to('user').emit('responderLocationUpdate', data);
    });

    socket.on('alert:refresh', (data: unknown) => {
      io.emit('alert:updated', data);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${env.PORT}`);
    console.log(`Local: http://localhost:${env.PORT}`);
    console.log(`Env: ${env.NODE_ENV}`);
  });

  const shutdown = (signal: string): void => {
    console.log(`Received ${signal}, shutting down...`);
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
