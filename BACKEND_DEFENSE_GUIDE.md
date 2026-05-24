# SafeAlert Backend Defense Guide

This file explains how the backend runs, what functions are used, and the important code blocks you can discuss during a project defense.

## 1. Backend Summary

The backend is a Node.js API built with:

- TypeScript for typed backend code
- Express for HTTP API routes
- MongoDB Atlas with Mongoose for database storage
- Socket.IO for live emergency, ambulance, location, and admin notifications
- JWT for login sessions
- bcryptjs for password hashing
- Zod for request validation
- Multer and MongoDB GridFS for uploaded images and documents

The backend source code is inside:

```text
backend/src
```

The compiled JavaScript output is inside:

```text
backend/dist
```

## 2. How The Backend Runs

The backend runs from `backend/package.json`.

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "npx tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

Use this command for local development:

```bash
cd backend
npm install
npm run dev
```

Use this command for production:

```bash
cd backend
npm run build
npm start
```

Explanation:

- `npm run dev` runs `src/server.ts` directly using `tsx watch`.
- `npm run build` compiles TypeScript from `src` into JavaScript inside `dist`.
- `npm start` runs the compiled backend using `node dist/server.js`.

## 3. Required Environment Variables

The backend validates environment variables in `backend/src/config/env.ts`.

```ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  BODY_LIMIT: z.string().default('1mb'),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_NAME: z.string().default('SafeAlert Admin'),
});
```

Important defense explanation:

The backend does not start if the environment configuration is invalid. This prevents the server from running without a database URL, JWT secrets, or admin account settings.

## 4. Main Startup Flow

The main backend entry file is:

```text
backend/src/server.ts
```

The important function is `bootstrap()`.

```ts
async function bootstrap(): Promise<void> {
  await connectDatabase();
  await seedAdmin();
  await seedAmbulanceUnits();

  const app = createApp();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: socketCorsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  app.set('io', io);

  io.on('connection', (socket) => {
    const auth = socket.data.auth;
    if (auth) {
      autoJoinRooms(socket, auth).catch(console.error);
    }

    socket.on('join:emergency', (emergencyId) => {
      socket.join(`emergency:${emergencyId}`);
    });
  });

  httpServer.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${env.PORT}`);
  });
}
```

Startup sequence:

1. Connect to MongoDB Atlas using `connectDatabase()`.
2. Create the default admin account using `seedAdmin()`.
3. Create default ambulance units using `seedAmbulanceUnits()`.
4. Build the Express app using `createApp()`.
5. Wrap Express inside an HTTP server.
6. Attach Socket.IO for real-time updates.
7. Start listening on `env.PORT`.

## 5. Database Connection

Database connection is handled in:

```text
backend/src/config/database.ts
```

```ts
export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });
}
```

Defense explanation:

The backend uses Mongoose to connect to MongoDB Atlas. All models such as users, responders, emergencies, ambulance requests, notifications, and audit logs are stored in MongoDB collections.

## 6. Express App Setup

The Express app is created in:

```text
backend/src/app.ts
```

The main function is `createApp()`.

```ts
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(helmet());
  app.use(cors({ origin: allowedOrigins, credentials: true }));
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
  app.use('/api/emergencies', emergenciesRoutes);
  app.use('/api/ambulance-requests', ambulanceUserRoutes);
  app.use('/api/admin/ambulance-requests', ambulanceAdminRoutes);
  app.use('/api/responder/ambulance-requests', ambulanceResponderRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
```

Defense explanation:

`createApp()` is where the backend configures security middleware, JSON parsing, CORS, health check route, and all API route groups.

## 7. Request Lifecycle

Most requests follow this pattern:

```text
Client request
-> Express route
-> requestId middleware
-> authGuard, roleGuard, rate limiter
-> validateRequest with Zod schema
-> service function
-> Mongoose model/database
-> Socket.IO event if real-time update is needed
-> JSON response
-> errorHandler if an error happens
```

Example route pattern:

```ts
router.post(
  '/',
  emergencyCreateLimiter,
  validateRequest({ body: createEmergencySchema }),
  async (req, res, next) => {
    try {
      const input = req.validated!.body as CreateEmergencyInput;
      const data = await svc.createEmergency(input, req.auth!, ctxFrom(req));
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },
);
```

Defense explanation:

Routes do not directly contain most business logic. They validate the request, read the authenticated user, call a service function, and return a response.

## 8. Security Middleware

### `authGuard`

File:

```text
backend/src/shared/middleware/authGuard.ts
```

Purpose:

Checks the `Authorization: Bearer <token>` header, verifies the JWT, and stores the logged-in account in `req.auth`.

```ts
export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError('Missing or malformed Authorization header', 401, 'UNAUTHENTICATED'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  const decoded = jwt.verify(token, env.JWT_SECRET);

  req.auth = {
    accountId: decoded.sub,
    email: decoded.email,
    role: decoded.role,
  };

  next();
}
```

### `roleGuard`

File:

```text
backend/src/shared/middleware/roleGuard.ts
```

Purpose:

Allows only specific roles to access a route.

```ts
export function roleGuard(...allowed: AuthRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
      return;
    }

    if (!allowed.includes(req.auth.role)) {
      next(new AppError('Forbidden for this role', 403, 'FORBIDDEN'));
      return;
    }

    next();
  };
}
```

### `validateRequest`

File:

```text
backend/src/shared/middleware/validateRequest.ts
```

Purpose:

Uses Zod schemas to validate request body, query, and params before the service function runs.

```ts
export function validateRequest(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      req.validated = {
        body: schemas.body ? schemas.body.parse(req.body) : req.body,
        query: schemas.query ? schemas.query.parse(req.query) : req.query,
        params: schemas.params ? schemas.params.parse(req.params) : req.params,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}
```

### `errorHandler`

File:

```text
backend/src/shared/middleware/errorHandler.ts
```

Purpose:

Converts validation errors, app errors, and unexpected errors into consistent JSON responses.

```ts
export function errorHandler(err: unknown, req: Request, res: Response): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        issues: err.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      requestId: req.requestId,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
      requestId: req.requestId,
    });
    return;
  }

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    requestId: req.requestId,
  });
}
```

## 9. Authentication Module

Files:

```text
backend/src/modules/auth/auth.routes.ts
backend/src/modules/auth/auth.service.ts
backend/src/modules/auth/jwt.ts
backend/src/modules/auth/auth.schemas.ts
```

Main routes:

| Endpoint | Function Used | Purpose |
|---|---|---|
| `POST /api/auth/register/user` | `registerUser()` | Register a citizen account with face photo and valid ID |
| `POST /api/auth/register/responder` | `registerResponder()` | Register a responder account |
| `POST /api/auth/login` | `login()` | Login user, responder, or admin |
| `POST /api/auth/refresh` | `refresh()` | Rotate refresh token and create new access token |
| `POST /api/auth/logout` | `logout()` | Revoke refresh token |
| `GET /api/auth/me` | `getMe()` | Get current account profile |
| `POST /api/auth/change-password` | `changePassword()` | Change password and revoke old sessions |

Important login code:

```ts
export async function login(input: LoginInput, req: Request): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email });
  const ok = await bcrypt.compare(input.password, user.password);

  if (!ok) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (user.approvalStatus !== 'approved' || !user.isApproved) {
    throw new AppError('Account not approved', 403, 'ACCOUNT_NOT_APPROVED');
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: 'user',
  });

  const { token: refreshToken } = await persistRefresh(user.id, 'user', clientMeta(req));

  return { accessToken, refreshToken, account: { id: user.id, email: user.email, role: 'user' } };
}
```

Important JWT code:

```ts
export function signAccessToken(claims: AccessTokenClaims): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
  return jwt.sign(claims, env.JWT_SECRET, opts);
}

export function mintRefreshToken(accountId: string, role: AuthRole): MintedRefresh {
  const jti = randomBytes(24).toString('hex');
  const payload = { sub: accountId, jti, role };
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, opts);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return { token, jti, tokenHash, expiresAt };
}
```

Defense explanation:

Passwords are hashed with bcrypt before saving. Login returns an access token and refresh token. Refresh tokens are stored only as hashes, so the raw refresh token is not saved directly in the database.

## 10. Emergency Module

Files:

```text
backend/src/modules/emergencies/emergencies.routes.ts
backend/src/modules/emergencies/admin.routes.ts
backend/src/modules/emergencies/emergencies.service.ts
backend/src/modules/emergencies/events.ts
backend/src/modules/emergencies/responderRoleAccess.ts
```

Main routes:

| Endpoint | Function Used | Role |
|---|---|---|
| `POST /api/emergencies` | `createEmergency()` | User |
| `GET /api/emergencies/active` | `listActive()` | Admin, responder |
| `GET /api/emergencies/my` | `listMine()` | User |
| `GET /api/emergencies/:id` | `getOne()` | Owner, assigned responder, admin |
| `POST /api/emergencies/:id/cancel` | `cancel()` | User |
| `POST /api/emergencies/:id/assign` | `assign()` | Admin, responder |
| `POST /api/emergencies/:id/on-the-way` | `setOnTheWay()` | Assigned responder |
| `POST /api/emergencies/:id/report` | `report()` | Assigned responder |
| `POST /api/admin/emergencies/:id/request-update` | `requestUpdate()` | Admin |
| `POST /api/admin/emergencies/:id/resolve` | `resolve()` | Admin |

Important emergency creation code:

```ts
export async function createEmergency(
  input: CreateEmergencyInput,
  auth: AuthContext,
  ctx: ServiceCtx,
): Promise<IEmergency> {
  if (auth.role !== 'user') {
    throw new AppError('Only users can create emergencies', 403, 'FORBIDDEN');
  }

  const [lng, lat] = input.location.coordinates;
  const scope = tanzaScope(lng, lat);
  const snapshot = await snapshotUser(auth.accountId);

  const created = await Emergency.create({
    type: input.type,
    source: input.source,
    priority: priorityFor(input.type),
    status: 'pending',
    userId: new mongoose.Types.ObjectId(auth.accountId),
    currentLocation: {
      type: 'Point',
      coordinates: input.location.coordinates,
      capturedAt: new Date(input.location.capturedAt),
    },
    isInsideTanza: scope.isInsideTanza,
    outsideScopeFlag: scope.outsideScopeFlag,
    userSnapshot: snapshot,
    timeline: [{ event: 'created', at: new Date(), actorRole: 'user' }],
  });

  await AuditLog.create({
    actorRole: 'user',
    action: 'emergency.created',
    targetType: 'emergency',
    targetId: created._id,
  });

  emitEmergencyEvent(ctx.io, 'emergency.created', created);
  return created;
}
```

Emergency priority logic:

```ts
export function priorityFor(type: EmergencyType): EmergencyPriority {
  switch (type) {
    case 'medical':
    case 'general_sos':
      return 'critical';
    case 'fire':
    case 'crime':
      return 'high';
  }
}
```

Responder role filtering:

```ts
export function canResponderHandleEmergency(
  responder: Pick<IResponder, 'responderRole' | 'department' | 'agencyType'>,
  emergencyType: EmergencyType,
): boolean {
  return emergencyTypesForResponder(responder).includes(emergencyType);
}
```

Defense explanation:

When a user creates an emergency, the backend saves the emergency record, stores a snapshot of the user details, checks if the location is inside Tanza, creates an audit log, and emits a real-time Socket.IO event to admins, the user, emergency room subscribers, and eligible responders.

## 11. Ambulance Request Module

Files:

```text
backend/src/modules/ambulance/user.routes.ts
backend/src/modules/ambulance/admin.routes.ts
backend/src/modules/ambulance/responder.routes.ts
backend/src/modules/ambulance/ambulance.service.ts
backend/src/modules/ambulance/ambulance.events.ts
```

Main user routes:

| Endpoint | Function Used | Purpose |
|---|---|---|
| `POST /api/ambulance-requests` | `createRequest()` | User creates ambulance request |
| `GET /api/ambulance-requests/my` | `listMine()` | User views own requests |
| `GET /api/ambulance-requests/availability` | `checkAvailability()` | Check available units |
| `GET /api/ambulance-requests/:id` | `getOne()` | View one request |
| `POST /api/ambulance-requests/:id/cancel` | `cancel()` | User cancels pending request |

Main admin routes:

| Endpoint | Function Used | Purpose |
|---|---|---|
| `GET /api/admin/ambulance-requests` | `listAdmin()` | Admin list |
| `GET /api/admin/ambulance-requests/units/available` | `getAvailableUnitsForAdmin()` | Find available unit |
| `POST /api/admin/ambulance-requests/:id/approve` | `approve()` | Approve request |
| `POST /api/admin/ambulance-requests/:id/reject` | `reject()` | Reject request |
| `POST /api/admin/ambulance-requests/:id/assign` | `assign()` | Assign responder and ambulance unit |
| `POST /api/admin/ambulance-requests/:id/mark-on-the-way` | `adminMarkOnTheWay()` | Admin transition |
| `POST /api/admin/ambulance-requests/:id/mark-picked-up` | `adminMarkPickedUp()` | Admin transition |
| `POST /api/admin/ambulance-requests/:id/mark-completed` | `adminMarkCompleted()` | Admin transition |

Main responder routes:

| Endpoint | Function Used | Purpose |
|---|---|---|
| `GET /api/responder/ambulance-requests` | `listResponderAssigned()` | Responder assigned list |
| `POST /api/responder/ambulance-requests/:id/on-the-way` | `setOnTheWay()` | Mark en route |
| `POST /api/responder/ambulance-requests/:id/arrived-pickup` | `setArrivedPickup()` | Mark arrived at pickup |
| `POST /api/responder/ambulance-requests/:id/patient-onboard` | `setPatientOnboard()` | Mark patient onboard |
| `POST /api/responder/ambulance-requests/:id/complete` | `complete()` | Complete transport |

Important ambulance request code:

```ts
export async function createRequest(
  input: CreateAmbulanceRequestInput,
  auth: AuthContext,
  ctx: ServiceCtx,
): Promise<IAmbulanceTransportRequest> {
  if (auth.role !== 'user') {
    throw new AppError('Only users can create transport requests', 403, 'FORBIDDEN');
  }

  const user = await User.findById(auth.accountId).lean();
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  if (!user.isApproved) throw new AppError('Account not approved', 403, 'ACCOUNT_NOT_APPROVED');

  const [pickupLng, pickupLat] = input.pickupLocation.coordinates;
  const scope = tanzaScope(pickupLng, pickupLat);

  const created = await AmbulanceTransportRequest.create({
    requestType: input.requestType,
    status: 'pending_review',
    senderUserId: new mongoose.Types.ObjectId(auth.accountId),
    patient: input.patient,
    pickupLocation: input.pickupLocation,
    dropOffLocation: input.dropOffLocation,
    isEmergencyPriority: input.requestType === 'emergency',
    outsideScopeFlag: scope.outsideScopeFlag,
    timeline: [{ event: 'created', at: new Date(), actorRole: 'user' }],
  });

  emitAmbulanceEvent(ctx.io, 'ambulance_request.created', created);
  return created;
}
```

Important assignment code:

```ts
export async function assign(
  id: string,
  body: AssignBody,
  auth: AuthContext,
  ctx: ServiceCtx,
): Promise<IAmbulanceTransportRequest> {
  const doc = await AmbulanceTransportRequest.findById(id);
  if (!doc) throw new AppError('Request not found', 404, 'NOT_FOUND');
  if (doc.status !== 'approved') {
    throw new AppError('Only approved requests can be assigned', 409, 'INVALID_TRANSITION');
  }

  const unit = await AmbulanceUnit.findById(body.ambulanceUnitId);
  const responder = await Responder.findById(body.responderId);

  doc.status = 'assigned';
  doc.assignedAmbulanceUnitId = unit._id;
  doc.assignedResponderId = responder._id;
  doc.assignedAt = new Date();
  await doc.save();

  unit.availabilityStatus = 'assigned';
  unit.activeRequestId = doc._id;
  await unit.save();

  emitAmbulanceEvent(ctx.io, 'ambulance_request.assigned', doc);
  return doc;
}
```

Defense explanation:

Ambulance requests have a controlled workflow: `pending_review -> approved -> assigned -> on_the_way -> arrived_pickup -> patient_onboard -> completed`. When completed, the ambulance unit is released back to `available`.

## 12. BLE And IoT Keychain Module

Files:

```text
backend/src/modules/ble/ble.routes.ts
backend/src/modules/ble/ble.service.ts
backend/src/modules/ble/ble.schemas.ts
```

Routes:

| Endpoint | Function Used | Purpose |
|---|---|---|
| `POST /api/user/ble-devices/pair` | `pairDevice()` | Pair panic button device |
| `GET /api/user/ble-devices` | `listDevices()` | List user's devices |
| `POST /api/user/ble-devices/:id/unpair` | `unpairDevice()` | Revoke pairing |
| `POST /api/user/ble-events` | `processBleEvent()` | Save device heartbeat/event |
| `POST /api/emergencies/from-iot` | `createFromIot()` | Create emergency from keychain trigger |

Important IoT emergency code:

```ts
export async function createFromIot(
  input: FromIotInput,
  auth: AuthContext,
  ctx: ServiceCtx,
) {
  const device = await BleDevice.findOne({
    userId: new mongoose.Types.ObjectId(auth.accountId),
    deviceId: input.deviceId,
    pairingStatus: 'paired',
  });

  if (!device) {
    throw new AppError('Device not found or not paired to your account', 403, 'DEVICE_NOT_PAIRED');
  }

  const idempotencyKey = `iot:${input.deviceId}:${input.eventId}:${auth.accountId}`;
  const duplicate = await Emergency.findOne({ idempotencyKey }).lean();
  if (duplicate) return duplicate;

  const emergency = await Emergency.create({
    type: input.buttonType,
    source: 'iot_keychain',
    priority: priorityFor(input.buttonType),
    status: 'pending',
    userId: new mongoose.Types.ObjectId(auth.accountId),
    sourceDeviceId: input.deviceId,
    bleEventId: input.eventId,
    idempotencyKey,
  });

  emitEmergencyEvent(ctx.io, 'emergency.iot_keychain_created', emergency);
  return emergency;
}
```

Defense explanation:

The IoT keychain can create an emergency if the device is paired to the user. The backend uses an `idempotencyKey` to avoid duplicate emergencies from the same IoT event.

## 13. Location Module

Files:

```text
backend/src/modules/locations/locations.routes.ts
backend/src/modules/locations/locations.service.ts
```

Routes:

| Endpoint | Function Used | Purpose |
|---|---|---|
| `POST /api/locations/user` | `ingestUserLocation()` | Save user GPS sample |
| `POST /api/locations/responder` | `ingestResponderLocation()` | Save responder GPS sample |
| `GET /api/emergencies/:id/location-history` | `getEmergencyLocationHistory()` | Emergency location history |
| `GET /api/ambulance-requests/:id/location-history` | `getAmbulanceLocationHistory()` | Ambulance request location history |
| `GET /api/responders/locations/live` | `getRespondersLive()` | Live responder map |
| `POST /api/responders/duty` | `updateResponderDutyStatus()` | Change responder duty status |

Important location code:

```ts
export async function ingestResponderLocation(
  input: IngestLocationInput,
  auth: AuthContext,
  ctx: ServiceCtx,
) {
  const sample = await LocationSample.create({
    actorId: new mongoose.Types.ObjectId(auth.accountId),
    actorType: 'responder',
    location: { type: 'Point', coordinates: input.coordinates },
    accuracyMeters: input.accuracyMeters,
    capturedAt: new Date(input.capturedAt),
    emergencyId: input.emergencyId
      ? new mongoose.Types.ObjectId(input.emergencyId)
      : undefined,
  });

  await Responder.findByIdAndUpdate(auth.accountId, {
    $set: {
      currentLocation: {
        latitude: input.coordinates[1],
        longitude: input.coordinates[0],
      },
    },
    $push: {
      locationHistory: {
        $each: [{ coordinates: input.coordinates, capturedAt: new Date(input.capturedAt) }],
        $slice: -100,
      },
    },
  });

  ctx.io?.to('admin:live').emit('location.responder_updated', {
    responderId: auth.accountId,
    coordinates: input.coordinates,
    capturedAt: input.capturedAt,
  });

  return sample;
}
```

Defense explanation:

The backend stores GPS points in `LocationSample`, updates the latest responder location, keeps only the last 100 embedded location history points, and emits live map updates through Socket.IO.

## 14. File Upload Module

Files:

```text
backend/src/modules/files/files.routes.ts
backend/src/modules/files/files.service.ts
```

Functions:

| Function | Purpose |
|---|---|
| `uploadBuffer()` | Upload image/document bytes to MongoDB GridFS |
| `deleteFile()` | Best-effort file cleanup |
| `updateFileOwner()` | Attach uploaded file to user/responder owner |
| `getFileInfo()` | Read file metadata |
| `openDownloadStream()` | Stream file bytes to the client |

Important file upload code:

```ts
export async function uploadBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata: UploadMetadata,
): Promise<mongoose.Types.ObjectId> {
  return new Promise((resolve, reject) => {
    const stream = getBucket().openUploadStream(filename, {
      metadata: { ...metadata, contentType },
    });

    stream.on('error', reject);
    stream.on('finish', () => resolve(stream.id as mongoose.Types.ObjectId));
    Readable.from(buffer).pipe(stream);
  });
}
```

Defense explanation:

Uploaded face photos, IDs, proof of residency, and responder credentials are saved in MongoDB GridFS instead of normal folders. The backend controls access to sensitive files.

## 15. Admin Module

Files:

```text
backend/src/modules/admin
```

Main admin features:

| Feature | Main Function Or Route |
|---|---|
| Registration approvals | `listRegistrations()`, `getRegistration()`, `approveRegistration()`, `rejectRegistration()` |
| Responder creation | `createResponder()` |
| Ambulance unit management | Inline route logic in `ambulance_units.routes.ts` |
| Audit logs | `humanizeAudit()` and audit log routes |
| Dashboard overview | `/api/admin/overview` |
| Reports | `/api/admin/reports`, `/api/admin/reports/filters` |

Important approval code:

```ts
export async function approveRegistration(args: {
  id: string;
  type: AccountType;
  notes?: string;
  admin: AdminContext;
}) {
  const doc =
    args.type === 'user'
      ? await User.findById(args.id)
      : await Responder.findById(args.id);

  if (!doc) throw new AppError('Registration not found', 404, 'NOT_FOUND');

  doc.approvalStatus = 'approved';
  doc.isApproved = true;
  doc.approvedAt = new Date();
  doc.approvedBy = new mongoose.Types.ObjectId(args.admin.adminId);
  await doc.save();

  await AuditLog.create({
    actorRole: 'admin',
    action: `${args.type}.approved`,
    targetType: args.type,
    targetId: doc._id,
  });

  return getRegistration(args.id, args.type);
}
```

Defense explanation:

New users and responders are not immediately active. Admin approval changes `approvalStatus` to `approved`, sets `isApproved` to `true`, records who approved it, and writes an audit log.

## 16. Notifications Module

Files:

```text
backend/src/modules/notifications/notifications.routes.ts
backend/src/modules/notifications/notifications.service.ts
```

Functions:

| Function | Purpose |
|---|---|
| `recordEmergencyNotification()` | Create admin notification for emergency events |
| `recordAmbulanceNotification()` | Create admin notification for ambulance events |
| `listForAdmin()` | List notifications for admin |
| `acknowledge()` | Mark notification as acknowledged |
| `markAllRead()` | Mark unread notifications as read |

Important notification code:

```ts
export async function recordEmergencyNotification(
  emergency: IEmergency,
  event: string,
  io: SocketServer | undefined,
): Promise<void> {
  if (!NOTIFY_EMERGENCY_EVENTS.has(event)) return;

  const doc = await AdminNotification.create({
    type: 'emergency',
    category: event,
    requestId: emergency._id,
    title,
    message,
    priority: priorityForEmergency(emergency, event),
    status: 'unread',
  });

  io?.to('admin:live').emit('admin_notification.created', toDto(doc));
}
```

Defense explanation:

When major emergency or ambulance events happen, the backend creates admin notifications and emits them live to the admin dashboard.

## 17. Socket.IO Real-Time Communication

Socket.IO is created in `server.ts`.

Rooms used by the backend:

| Room | Purpose |
|---|---|
| `admin:live` | Live admin dashboard updates |
| `user:<accountId>` | Private updates for a user |
| `responder:<accountId>` | Private updates for a responder |
| `emergency:<emergencyId>` | Live updates for one emergency |
| `responder-feed:<type>` | Emergency feed filtered by responder type |

Important room-join code:

```ts
async function autoJoinRooms(socket: Socket, auth: AuthContext): Promise<void> {
  const { accountId, role } = auth;

  if (role === 'user') socket.join(`user:${accountId}`);

  if (role === 'responder') {
    socket.join(`responder:${accountId}`);

    const responder = await Responder.findById(accountId)
      .select('responderRole department agencyType')
      .lean();

    if (responder) {
      const types = emergencyTypesForResponder(responder);
      for (const type of types) {
        socket.join(`responder-feed:${type}`);
      }
    }
  }

  if (role === 'admin') socket.join('admin:live');
}
```

Important event emit code:

```ts
export function emitEmergencyEvent(
  io: SocketServer | undefined,
  event: EmergencyEventName,
  emergency: IEmergency,
): void {
  const payload = buildPayload(emergency);

  io?.to('admin:live').emit(event, payload);
  io?.to(`user:${emergency.userId.toString()}`).emit(event, payload);
  io?.to(`emergency:${emergency._id.toString()}`).emit(event, payload);
  io?.to(`responder-feed:${emergency.type}`).emit(event, payload);

  if (emergency.assignedResponderId) {
    io?.to(`responder:${emergency.assignedResponderId.toString()}`).emit(event, payload);
  }
}
```

Defense explanation:

Socket.IO allows the system to update dashboards and mobile apps instantly without waiting for page refresh. Admins receive all live events, users receive their own updates, and responders receive emergencies that match their role.

## 18. Main Database Models

All models are exported from:

```text
backend/src/models/index.ts
```

| Model | Purpose |
|---|---|
| `User` | Citizen account, approval status, profile, contacts, location history |
| `Responder` | Responder account, role, agency, duty status, current location |
| `Admin` | Admin account |
| `RefreshToken` | Hashed refresh tokens for session rotation |
| `Emergency` | Emergency request, location, status, timeline, assigned responder |
| `AmbulanceTransportRequest` | Ambulance transport workflow |
| `AmbulanceUnit` | Ambulance unit availability and assignments |
| `BleDevice` | Paired IoT keychain devices |
| `LocationSample` | GPS samples for users and responders |
| `AuditLog` | Admin/user/responder action logs |
| `AdminNotification` | Notification center records |
| `Alert` | Older alert route model still mounted at `/api/alerts` |
| `Contact` | Older contact model; current contacts are embedded in `User` |

Important emergency model fields:

```ts
export interface IEmergency extends Document {
  type: EmergencyType;
  source: EmergencySource;
  priority: EmergencyPriority;
  status: EmergencyStatus;
  userId: mongoose.Types.ObjectId;
  assignedResponderId?: mongoose.Types.ObjectId;
  currentLocation: {
    type: 'Point';
    coordinates: [number, number];
    accuracyMeters?: number;
    capturedAt: Date;
  };
  isInsideTanza: boolean;
  outsideScopeFlag: boolean;
  timeline: mongoose.Types.DocumentArray<ITimelineEvent>;
}
```

Important ambulance model statuses:

```ts
export type AmbulanceRequestStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'assigned'
  | 'on_the_way'
  | 'arrived_pickup'
  | 'patient_onboard'
  | 'completed'
  | 'cancelled';
```

## 19. Main API Groups

The backend mounts routes like this in `app.ts`:

```ts
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminApprovalsRoutes);
app.use('/api/admin', adminAuditRoutes);
app.use('/api/admin', adminRespondersRoutes);
app.use('/api/admin', adminAmbulanceUnitsRoutes);
app.use('/api/admin', adminReportsRoutes);
app.use('/api/admin/emergencies', adminEmergenciesRoutes);
app.use('/api/emergencies', emergenciesRoutes);
app.use('/api/ambulance-requests', ambulanceUserRoutes);
app.use('/api/admin/ambulance-requests', ambulanceAdminRoutes);
app.use('/api/responder/ambulance-requests', ambulanceResponderRoutes);
app.use('/api/user/ble-devices', bleDeviceRouter);
app.use('/api/user/ble-events', bleEventRouter);
app.use('/api/emergencies/from-iot', iotEmergencyRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/files', filesRoutes);
app.use('/api/admin/notifications', notificationsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/contacts', contactsRoutes);
```

## 20. Example Defense Explanation Script

You can explain the backend like this:

```text
Our backend is a TypeScript Node.js server using Express, MongoDB, Mongoose, JWT authentication, and Socket.IO.

The backend starts from server.ts. First it validates environment variables, connects to MongoDB Atlas, seeds the admin account and ambulance units, creates the Express app, attaches Socket.IO, then listens on the configured port.

The Express app is created in app.ts. It applies security middleware like Helmet, CORS, Mongo sanitize, request IDs, JSON parsing, and then mounts API route modules.

Each request goes through middleware. Protected routes use authGuard to verify the JWT. Role-specific routes use roleGuard. Request bodies are validated with Zod through validateRequest. After validation, the route calls a service function, and the service function performs the business logic using Mongoose models.

For example, when a user creates an emergency, the createEmergency function checks that the logged-in account is a user, checks the Tanza location scope, saves the Emergency document, adds an AuditLog, and emits a Socket.IO event so admins and responders receive live updates.

For ambulance requests, the backend uses a workflow: pending_review, approved, assigned, on_the_way, arrived_pickup, patient_onboard, and completed. The assign function links the request to an ambulance unit and responder, and when completed the unit becomes available again.

The backend also supports BLE panic button devices. A paired device can create an IoT emergency through createFromIot, and the idempotency key prevents duplicate emergencies from the same device event.

All important actions are logged in AuditLog, and major emergency or ambulance events create AdminNotification records and live admin dashboard notifications.
```

## 21. Short Defense Answers

Question: Where does the backend start?

Answer:

```text
It starts in backend/src/server.ts through bootstrap(). That function connects the database, seeds initial data, creates the Express app, attaches Socket.IO, and starts listening on the configured port.
```

Question: How is authentication handled?

Answer:

```text
Login checks the password with bcrypt, signs an access token with JWT, and creates a refresh token. Protected routes use authGuard to verify the Bearer token and roleGuard to limit access by role.
```

Question: How are requests validated?

Answer:

```text
The backend uses Zod schemas and the validateRequest middleware. It validates body, query, and route params before the service function runs.
```

Question: How does real-time notification work?

Answer:

```text
The backend uses Socket.IO. Users, responders, and admins automatically join rooms. When an emergency or ambulance request changes, the service emits an event to the correct room.
```

Question: What database is used?

Answer:

```text
MongoDB Atlas is used through Mongoose. Each major feature has a Mongoose model, such as User, Responder, Emergency, AmbulanceTransportRequest, AmbulanceUnit, AuditLog, and AdminNotification.
```

Question: Why is there an audit log?

Answer:

```text
AuditLog records important actions such as creating emergencies, approving users, assigning ambulance units, and resolving requests. This helps accountability and traceability.
```

## 22. Backend Modules Checklist

- `config`: environment validation and database connection
- `models`: MongoDB schemas and collections
- `shared/middleware`: auth, role checks, validation, request IDs, rate limiters, errors
- `modules/auth`: login, register, refresh token, logout, password change
- `modules/emergencies`: emergency creation, assignment, reporting, resolving
- `modules/ambulance`: ambulance request workflow and unit assignment
- `modules/ble`: BLE keychain pairing and IoT emergency creation
- `modules/locations`: GPS ingestion, live responder location, history
- `modules/files`: GridFS upload and secure file download
- `modules/admin`: approvals, responders, ambulance units, audit, reports
- `modules/notifications`: admin notifications and unread counts
- `routes/alerts` and `routes/contacts`: older/simple route handlers still mounted for compatibility

