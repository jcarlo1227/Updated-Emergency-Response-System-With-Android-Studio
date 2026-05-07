import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { requestId, errorHandler, notFoundHandler, } from './shared/middleware/index.js';
import { authRoutes } from './modules/auth/index.js';
import { adminApprovalsRoutes, adminAuditRoutes } from './modules/admin/index.js';
import { emergenciesRoutes, adminEmergenciesRoutes } from './modules/emergencies/index.js';
import { ambulanceUserRoutes, ambulanceAdminRoutes, ambulanceResponderRoutes, } from './modules/ambulance/index.js';
import { bleDeviceRouter, bleEventRouter, iotEmergencyRouter } from './modules/ble/index.js';
import { locationsRouter, emergencyHistoryRouter, ambulanceHistoryRouter, respondersLiveRouter, } from './modules/locations/index.js';
import alertRoutes from './routes/alerts.js';
import contactsRoutes from './routes/contacts.js';
export function createApp() {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', 1);
    app.use(requestId);
    app.use(helmet());
    app.use(cors({
        origin: (origin, cb) => {
            if (!origin)
                return cb(null, true);
            if (env.CORS_ORIGINS.includes(origin))
                return cb(null, true);
            cb(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    }));
    app.use(express.json({ limit: env.BODY_LIMIT }));
    app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));
    app.use(mongoSanitize());
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'MongoDB Atlas',
            requestId: req.requestId,
        });
    });
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminApprovalsRoutes);
    app.use('/api/admin', adminAuditRoutes);
    app.use('/api/admin/emergencies', adminEmergenciesRoutes);
    app.use('/api/emergencies', emergenciesRoutes);
    app.use('/api/ambulance-requests', ambulanceUserRoutes);
    app.use('/api/admin/ambulance-requests', ambulanceAdminRoutes);
    app.use('/api/responder/ambulance-requests', ambulanceResponderRoutes);
    app.use('/api/user/ble-devices', bleDeviceRouter);
    app.use('/api/user/ble-events', bleEventRouter);
    app.use('/api/emergencies/from-iot', iotEmergencyRouter);
    app.use('/api/locations', locationsRouter);
    app.use('/api/emergencies', emergencyHistoryRouter);
    app.use('/api/ambulance-requests', ambulanceHistoryRouter);
    app.use('/api/responders', respondersLiveRouter);
    app.use('/api/alerts', alertRoutes);
    app.use('/api/contacts', contactsRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
