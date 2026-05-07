import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import contactsRoutes from './routes/contacts.js';
dotenv.config();
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
// Socket.io setup for real-time updates
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow all origins for development
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
    }
});
// Make io accessible to routes
app.set('io', io);
// Middleware
app.use(cors({
    origin: '*', // Allow all origins for development
    credentials: true
}));
app.use(express.json());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/contacts', contactsRoutes);
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'MongoDB Atlas',
    });
});
// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    // Join room based on user type
    socket.on('join', (data) => {
        socket.join(data.type);
        socket.join(data.id);
        console.log(`📡 ${data.type} ${data.id} joined`);
    });
    // Responder location update
    socket.on('responderLocation', (data) => {
        io.to('user').emit('responderLocationUpdate', data);
    });
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});
// Connect to database and start server
const startServer = async () => {
    await connectDatabase();
    httpServer.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
        console.log(`📍 Local access: http://localhost:${PORT}`);
        console.log(`📱 Phone access: http://192.168.1.10:${PORT}`);
        console.log(`🔌 WebSocket server ready`);
        console.log(`\n📱 API endpoints:`);
        console.log(`   POST /api/auth/register/user`);
        console.log(`   POST /api/auth/register/responder`);
        console.log(`   POST /api/auth/login/user`);
        console.log(`   POST /api/auth/login/responder`);
        console.log(`   POST /api/alerts`);
        console.log(`   GET  /api/alerts`);
        console.log(`   GET  /api/alerts/stats/summary`);
        console.log(`   PATCH /api/alerts/:id/status`);
        console.log(`   PATCH /api/alerts/:id/location (GPS update)`);
        console.log(`   GET  /api/contacts/:userId`);
        console.log(`   POST /api/contacts/:userId`);
    });
};
startServer();
