import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL ?? '/api').replace('/api', '');

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;
  const token = localStorage.getItem('admin_access_token');
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 2000,
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
