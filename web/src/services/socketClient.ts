import { io, type Socket } from 'socket.io-client';

const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const SOCKET_URL =
  configuredSocketUrl ?? configuredApiUrl?.replace(/\/api\/?$/, '') ?? undefined;

let socket: Socket | null = null;

function authPayload() {
  const token = localStorage.getItem('admin_access_token');
  return token ? { token } : {};
}

export function connectSocket(): Socket {
  if (socket) {
    socket.auth = authPayload();
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: authPayload(),
    reconnection: true,
    reconnectionDelay: 2000,
  });
  socket.io.on('reconnect_attempt', () => {
    if (socket) socket.auth = authPayload();
  });
  socket.on('connect', () => console.log('[socket] connected:', socket?.id));
  socket.on('disconnect', (reason) => console.log('[socket] disconnected:', reason));
  socket.on('connect_error', (err) => console.warn('[socket] error:', err.message));
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
