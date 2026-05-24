# SafeAlert Backend Panel Q&A Preparation

Use this file to practice answering backend questions during your defense. The answers are written in a way you can speak naturally to a panelist.

## 1. Backend Overview

### Q1: Can you explain your backend in simple terms?

Answer:

Our backend is the server-side part of SafeAlert. It receives requests from the mobile apps and admin web dashboard, validates the data, saves records in MongoDB, handles authentication, and sends real-time updates using Socket.IO. It is built with Node.js, TypeScript, Express, MongoDB, Mongoose, JWT, and Socket.IO.

Follow-up:

The backend is organized by modules such as authentication, emergencies, ambulance requests, BLE devices, locations, files, notifications, and admin management.

### Q2: What is the main purpose of the backend?

Answer:

The main purpose of the backend is to manage emergency reporting, ambulance transport requests, responder assignments, live location updates, user and responder authentication, admin approvals, and real-time notifications.

### Q3: Where is the backend code located?

Answer:

The backend code is located inside `backend/src`. The main startup file is `backend/src/server.ts`, and the Express app configuration is in `backend/src/app.ts`.

### Q4: What technologies did you use for the backend?

Answer:

We used TypeScript with Node.js for the server, Express for API routing, MongoDB Atlas for the database, Mongoose for database models, JWT for authentication, bcryptjs for password hashing, Zod for validation, Multer and GridFS for file uploads, and Socket.IO for real-time communication.

### Q5: Why did you use TypeScript instead of plain JavaScript?

Answer:

We used TypeScript because it helps catch errors earlier through type checking. Since the backend handles sensitive records like emergencies, users, responders, and ambulance requests, strong typing helps make the code more reliable and easier to maintain.

## 2. Running The Backend

### Q6: How do you run the backend locally?

Answer:

I go to the backend folder, install dependencies, and run the development script:

```bash
cd backend
npm install
npm run dev
```

The `npm run dev` command uses `tsx watch src/server.ts`, so it runs the TypeScript server and watches for changes.

### Q7: How does the backend run in production?

Answer:

For production, the TypeScript code is compiled first, then the compiled JavaScript is executed:

```bash
npm run build
npm start
```

`npm run build` runs the TypeScript compiler, and `npm start` runs `node dist/server.js`.

### Q8: What file starts the backend?

Answer:

The backend starts from `backend/src/server.ts`. The important function there is `bootstrap()`, which connects to the database, seeds initial data, creates the Express app, attaches Socket.IO, and starts the HTTP server.

### Q9: What happens when the server starts?

Answer:

First, it validates the environment variables. Then it connects to MongoDB Atlas, seeds the admin account and ambulance units, creates the Express app, creates an HTTP server, attaches Socket.IO for real-time events, and listens on the configured port.

### Q10: What port does the backend use?

Answer:

The port comes from the `PORT` environment variable. If no port is provided, the default is `5000`.

## 3. Environment And Configuration

### Q11: What environment variables does the backend need?

Answer:

The backend needs variables like `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGINS`, and `PORT`. These are validated in `backend/src/config/env.ts`.

### Q12: What happens if an environment variable is missing?

Answer:

The backend will not start. The `env.ts` file uses Zod to validate the configuration, and if something important is missing or invalid, it logs the problem and exits the process.

### Q13: Why validate environment variables?

Answer:

It prevents the backend from running in an unsafe or broken state. For example, the server should not start without a MongoDB connection string or JWT secret because authentication and database operations would fail.

## 4. Database

### Q14: What database does the backend use?

Answer:

The backend uses MongoDB Atlas, and it connects through Mongoose.

### Q15: Where is the database connection handled?

Answer:

The database connection is handled in `backend/src/config/database.ts` through the `connectDatabase()` function.

### Q16: Why did you use MongoDB?

Answer:

MongoDB fits the project because the data is document-based. Emergency records, ambulance requests, timelines, user snapshots, and location histories can be stored naturally as documents. It also works well with Mongoose schemas and indexes.

### Q17: What is Mongoose used for?

Answer:

Mongoose defines schemas and models for MongoDB collections. It helps validate database structure, create indexes, and perform queries using models like `User`, `Responder`, `Emergency`, and `AmbulanceTransportRequest`.

### Q18: What are the main database models?

Answer:

The main models are `User`, `Responder`, `Admin`, `Emergency`, `AmbulanceTransportRequest`, `AmbulanceUnit`, `BleDevice`, `LocationSample`, `AuditLog`, `AdminNotification`, and `RefreshToken`.

### Q19: How do you store emergency data?

Answer:

Emergency data is stored in the `Emergency` model. It includes the emergency type, source, priority, status, user ID, assigned responder, current location, Tanza scope flags, user snapshot, and timeline events.

### Q20: Why does the emergency model have a timeline?

Answer:

The timeline records the history of the emergency, such as when it was created, assigned, marked on the way, reported by the responder, requested for update, resolved, or cancelled. This makes the emergency traceable.

## 5. Express App And Routes

### Q21: What is Express used for?

Answer:

Express is used to create the REST API. It handles routes like login, registration, emergency creation, ambulance requests, admin approvals, location updates, and file downloads.

### Q22: Where are routes mounted?

Answer:

Routes are mounted in `backend/src/app.ts`. For example, `/api/auth` is connected to the auth routes, `/api/emergencies` to emergency routes, and `/api/ambulance-requests` to ambulance request routes.

### Q23: Why did you separate routes and services?

Answer:

Routes handle HTTP concerns like reading the request and sending the response. Services contain the actual business logic. This keeps the code cleaner and easier to test and maintain.

### Q24: Can you give an example of route-to-service flow?

Answer:

For creating an emergency, the route `POST /api/emergencies` validates the request body, gets the authenticated user from `req.auth`, then calls `createEmergency()` from `emergencies.service.ts`. The service saves the emergency, logs the action, emits a real-time event, and returns the created emergency.

## 6. Middleware

### Q25: What middleware does your backend use?

Answer:

The backend uses middleware for request IDs, security headers, CORS, JSON parsing, URL encoding, MongoDB query sanitization, authentication, role checking, validation, rate limiting, not-found handling, and error handling.

### Q26: What is `authGuard`?

Answer:

`authGuard` checks the `Authorization` header for a Bearer token. It verifies the JWT and stores the authenticated account details in `req.auth`.

### Q27: What is `roleGuard`?

Answer:

`roleGuard` restricts a route to specific roles. For example, admin-only routes use `roleGuard('admin')`, and responder routes use `roleGuard('responder')`.

### Q28: What is `validateRequest`?

Answer:

`validateRequest` validates the request body, query, and params using Zod schemas. If the request is invalid, the backend returns a validation error before reaching the service function.

### Q29: Why use Zod validation?

Answer:

Zod ensures that the backend receives the correct data format. It prevents invalid or incomplete data from being saved, such as missing coordinates, invalid email, invalid role, or invalid object ID.

### Q30: What is the purpose of the error handler?

Answer:

The error handler converts errors into consistent JSON responses. It handles Zod validation errors, custom `AppError` errors, and unexpected internal server errors.

## 7. Authentication And Authorization

### Q31: How does login work?

Answer:

The login function checks the email and password. The password is compared using bcrypt. If valid, the backend creates an access token and refresh token. The access token is used for protected requests, while the refresh token is used to get a new access token later.

### Q32: How are passwords stored?

Answer:

Passwords are not stored as plain text. They are hashed using bcrypt before saving to MongoDB.

### Q33: What is JWT used for?

Answer:

JWT is used to identify the logged-in account. The access token contains the account ID, email, and role. Protected routes verify this token before allowing access.

### Q34: What is the difference between access token and refresh token?

Answer:

The access token is short-lived and used to access protected routes. The refresh token lasts longer and is used to request a new access token. The backend stores only the hashed refresh token for security.

### Q35: Why store refresh tokens as hashes?

Answer:

If the database is exposed, raw refresh tokens would be dangerous. By storing only the hash, the actual token is not directly available from the database.

### Q36: How does logout work?

Answer:

Logout revokes the refresh token by updating its database record with a `revokedAt` timestamp.

### Q37: How does change password work?

Answer:

The backend verifies the current password, hashes the new password, saves it, and revokes all active refresh tokens for that account. This forces old sessions to be invalid.

### Q38: How do you prevent pending users from logging in?

Answer:

During login, the backend checks `approvalStatus` and `isApproved`. If the account is still pending or rejected, the backend returns `ACCOUNT_NOT_APPROVED`.

## 8. User And Responder Registration

### Q39: How does user registration work?

Answer:

A user submits personal details, password, face capture image, and valid ID or proof of residency. The backend validates the data, uploads the files to GridFS, hashes the password, creates the user record, and sets the account as pending approval.

### Q40: Why is admin approval required?

Answer:

Admin approval ensures that only verified users and responders can use sensitive system features. It is important because the system handles emergency reporting and responder operations.

### Q41: How does responder registration work?

Answer:

A responder submits details such as name, email, badge ID, department, agency type, and optional credential files. The backend checks for duplicate email or badge ID, uploads files if provided, hashes the password, and creates a pending responder account.

### Q42: How does admin approve a registration?

Answer:

The admin route calls `approveRegistration()`. This changes `approvalStatus` to `approved`, sets `isApproved` to `true`, stores who approved the account, and creates an audit log.

### Q43: How does admin reject a registration?

Answer:

The admin route calls `rejectRegistration()`. This sets `approvalStatus` to `rejected`, sets `isApproved` to `false`, saves the rejection reason, and creates an audit log.

## 9. Emergency Workflow

### Q44: How does a user create an emergency?

Answer:

The user sends an emergency type, source, location, and optional notes. The backend validates the request, checks that the account role is `user`, checks whether the location is inside Tanza, saves the emergency, adds an audit log, and emits a real-time event.

### Q45: What emergency types are supported?

Answer:

The supported emergency types are `medical`, `crime`, `fire`, and `general_sos`.

### Q46: How is emergency priority determined?

Answer:

The `priorityFor()` function sets medical and general SOS as `critical`, while fire and crime are set as `high`.

### Q47: What is `snapshotUser()` used for?

Answer:

`snapshotUser()` copies important user details into the emergency record, such as name, age, phone, blood type, address, face capture file ID, valid ID file ID, and emergency contact. This keeps the emergency record useful even if the user profile changes later.

### Q48: How does the backend know if the emergency is inside Tanza?

Answer:

The backend uses the `tanzaScope()` utility. It checks the submitted longitude and latitude against the configured Tanza bounding box and sets `isInsideTanza` and `outsideScopeFlag`.

### Q49: Who can view active emergencies?

Answer:

Admins and responders can view active emergencies. Responders only see emergencies that match their role, department, or agency type unless they are directly assigned.

### Q50: How are emergencies assigned?

Answer:

The `assign()` function assigns an emergency to a responder. Admins can assign a specific responder. Responders can also assign themselves if the emergency type matches their role.

### Q51: How does responder role filtering work?

Answer:

The backend uses `emergencyTypesForResponder()` and `canResponderHandleEmergency()`. For example, medics handle medical emergencies, fire responders handle fire emergencies, police responders handle crime, and disaster or general responders handle general SOS.

### Q52: How does a responder mark that they are on the way?

Answer:

The responder calls the `setOnTheWay()` function through the route `POST /api/emergencies/:id/on-the-way`. The backend checks that the responder is assigned to that emergency and that the current status is `assigned`, then changes it to `responder_on_the_way`.

### Q53: How is an emergency resolved?

Answer:

Only an admin can resolve an emergency. The `resolve()` function changes the status to `resolved`, records the resolution time and admin ID, adds a timeline event, creates an audit log, emits a real-time update, and sets the responder duty status back to available.

### Q54: Can a user cancel an emergency?

Answer:

Yes, but only if the emergency is still in `pending` status. Once it is assigned, the user cannot cancel it anymore because response operations have already started.

## 10. Ambulance Request Workflow

### Q55: What is the difference between emergency and ambulance request modules?

Answer:

The emergency module handles immediate emergency reports like medical, fire, crime, and general SOS. The ambulance request module handles ambulance transport, including emergency transport, scheduled transport, and transfer requests.

### Q56: What ambulance request types are supported?

Answer:

The supported request types are `emergency`, `schedule`, and `transfer`.

### Q57: What is the ambulance request workflow?

Answer:

The workflow is `pending_review`, `approved`, `assigned`, `on_the_way`, `arrived_pickup`, `patient_onboard`, `completed`, or it can become `rejected` or `cancelled`.

### Q58: How does a user create an ambulance request?

Answer:

The user submits patient information, pickup location, drop-off location, request type, requested date or time, and optional notes. The backend verifies that the user is approved, creates the request with `pending_review` status, logs the action, and sends a real-time event to admins.

### Q59: Why does an ambulance request start as `pending_review`?

Answer:

It starts as `pending_review` because an admin must check the request details, priority, and availability before approving or assigning ambulance resources.

### Q60: How does admin approve an ambulance request?

Answer:

The admin calls the approve endpoint. The backend checks that the request is still `pending_review`, changes the status to `approved`, saves the review information, creates an audit log, and emits a real-time event.

### Q61: How does admin assign an ambulance request?

Answer:

The admin selects an ambulance unit and responder. The backend checks that the request is approved, the unit is available, the responder is approved and available, and there are no reservation conflicts. Then it assigns the unit and responder and changes the request status to `assigned`.

### Q62: How does the backend check ambulance availability?

Answer:

The backend checks for ambulance units that are not in maintenance or out of service and are not already assigned to another request during the requested time window.

### Q63: What happens when an ambulance request is completed?

Answer:

When completed, the backend changes the request status to `completed`, updates the timeline, creates an audit log, emits a real-time event, and releases the ambulance unit back to `available`.

### Q64: What is the purpose of `getAvailableUnits()`?

Answer:

`getAvailableUnits()` finds ambulance units that are available for a given start and end time by excluding units already assigned to active requests during that time window.

## 11. BLE And IoT Keychain

### Q65: What is the BLE module for?

Answer:

The BLE module supports the panic button or IoT keychain feature. It lets users pair a BLE device, update device status, unpair a device, and create an emergency from a device trigger.

### Q66: How does device pairing work?

Answer:

The `pairDevice()` function checks if the device is already paired to another account. If not, it creates or updates a `BleDevice` record connected to the user's account.

### Q67: How does the IoT keychain create an emergency?

Answer:

The keychain sends a device ID, event ID, button type, and location. The backend checks that the device is paired to the user, creates an emergency with source `iot_keychain`, saves the device and event details, creates an audit log, and emits a real-time emergency event.

### Q68: How does the backend prevent duplicate IoT emergencies?

Answer:

It uses an `idempotencyKey` based on the device ID, event ID, and user ID. If the same event is submitted again, the backend returns the existing emergency instead of creating a duplicate.

## 12. Location Tracking

### Q69: How does location tracking work?

Answer:

The mobile app sends GPS coordinates to the backend. The backend stores them in `LocationSample`, updates the user's or responder's location history, and emits Socket.IO events for live map updates.

### Q70: Where are location samples stored?

Answer:

Detailed location samples are stored in the `LocationSample` model. The backend also stores a limited location history inside the `User` or `Responder` document for quick access.

### Q71: Why does the backend keep only the last 100 embedded location points?

Answer:

It prevents the user or responder document from growing too large. Full history can still be stored separately in `LocationSample`.

### Q72: How does the admin dashboard get live responder locations?

Answer:

Responders send their location to `POST /api/locations/responder`. The backend updates the responder's current location and emits `location.responder_updated` to the `admin:live` Socket.IO room.

### Q73: What is responder duty status?

Answer:

Responder duty status shows whether a responder is off duty, on duty, available, busy, responding, inactive, unavailable, offline, or suspended. This helps admins know who can be assigned.

## 13. Socket.IO And Real-Time Updates

### Q74: Why did you use Socket.IO?

Answer:

We used Socket.IO because emergency and ambulance systems need real-time updates. Admins and responders should see new emergencies, assignments, location changes, and notifications immediately without refreshing the page.

### Q75: What rooms does Socket.IO use?

Answer:

The backend uses rooms such as `admin:live`, `user:<accountId>`, `responder:<accountId>`, `emergency:<emergencyId>`, and `responder-feed:<type>`.

### Q76: What is the purpose of `admin:live`?

Answer:

`admin:live` is the Socket.IO room for the admin dashboard. It receives live emergency events, ambulance events, responder status updates, location updates, and admin notifications.

### Q77: How does a responder receive only relevant emergencies?

Answer:

When a responder connects, `autoJoinRooms()` checks the responder's role, department, and agency type. The responder joins feed rooms like `responder-feed:medical`, `responder-feed:fire`, or `responder-feed:crime` depending on their allowed emergency types.

### Q78: What function emits emergency events?

Answer:

The `emitEmergencyEvent()` function emits emergency updates to the admin room, user room, emergency room, responder feed room, and assigned responder room.

### Q79: What function emits ambulance events?

Answer:

The `emitAmbulanceEvent()` function emits ambulance request updates to the admin room, the request owner's user room, and the assigned responder room.

## 14. File Uploads

### Q80: How does file upload work?

Answer:

The backend uses Multer to receive uploaded files in memory, then stores them in MongoDB GridFS through the `uploadBuffer()` function.

### Q81: What files are uploaded?

Answer:

The backend uploads files such as face capture images, valid IDs, proof of residency, and responder credentials.

### Q82: Why use GridFS?

Answer:

GridFS allows files to be stored inside MongoDB. This keeps file metadata and ownership connected to the database and avoids relying on local server folders.

### Q83: How does the backend protect uploaded files?

Answer:

The file route checks the authenticated user before streaming a file. Admins can access files, but normal users and responders can only access sensitive files if they own them.

## 15. Admin Features

### Q84: What can the admin do in the backend?

Answer:

The admin can approve or reject users and responders, create responders, manage ambulance units, approve and assign ambulance requests, resolve emergencies, view audit logs, view reports, and receive notifications.

### Q85: How are ambulance units managed?

Answer:

Admins can create, view, update, and delete ambulance units. The backend prevents deleting a unit if it is currently assigned to an active request.

### Q86: How does the admin dashboard overview get its data?

Answer:

The overview route counts active emergencies, pending ambulance requests, available responders, active responders, pending approvals, resolved emergencies today, and system status. It uses MongoDB queries and aggregation.

### Q87: How are reports generated?

Answer:

The reports route uses MongoDB aggregation to count emergencies by status, type, barangay, responder activity, ambulance usage, monthly trends, and average response time.

## 16. Audit Logs And Notifications

### Q88: What is the purpose of audit logs?

Answer:

Audit logs provide accountability. They record important actions such as emergency creation, emergency assignment, ambulance approval, ambulance assignment, user approval, responder approval, and ambulance unit changes.

### Q89: What data is stored in an audit log?

Answer:

An audit log stores the actor ID, actor role, action name, target type, target ID, metadata, request ID, IP address, user agent, severity, and created date.

### Q90: What is `humanizeAudit()`?

Answer:

`humanizeAudit()` converts technical audit action names into readable descriptions for the admin dashboard. For example, `emergency.created` becomes a readable sentence like a user reported an emergency.

### Q91: What are admin notifications?

Answer:

Admin notifications are records shown to admins when important events happen, such as a new emergency, new ambulance request, assigned request, completed request, or responder report.

### Q92: How are notifications created?

Answer:

Emergency and ambulance event functions call `recordEmergencyNotification()` or `recordAmbulanceNotification()`. These create `AdminNotification` records and emit them to `admin:live`.

## 17. API Security

### Q93: How do you secure admin routes?

Answer:

Admin routes use both `authGuard` and `roleGuard('admin')`. This means the request must have a valid JWT and the account role must be admin.

### Q94: How do you prevent invalid data from entering the database?

Answer:

The backend uses Zod schemas through `validateRequest()` before the service logic runs. Mongoose schemas also provide another layer of validation at the database model level.

### Q95: How do you protect against MongoDB injection?

Answer:

The backend uses `express-mongo-sanitize`, which removes dangerous MongoDB operators from request input.

### Q96: How do you protect against too many requests?

Answer:

The backend uses rate limiters for sensitive routes such as login, registration, refresh token, emergency creation, ambulance requests, file upload, and admin actions.

### Q97: How do you protect passwords?

Answer:

Passwords are hashed with bcrypt. The backend never needs to decrypt passwords. It only compares the submitted password with the stored hash.

### Q98: How do you protect sessions?

Answer:

Sessions use JWT access tokens and refresh tokens. Refresh tokens are hashed in the database, rotated during refresh, and revoked on logout or password change.

## 18. Error Handling And Validation

### Q99: What happens when the request body is invalid?

Answer:

The Zod validation throws an error, and the error handler returns a `400 VALIDATION_ERROR` response with details about which fields are invalid.

### Q100: What is `AppError`?

Answer:

`AppError` is a custom error class that includes a message, HTTP status code, and error code. It helps return clear API errors like `FORBIDDEN`, `NOT_FOUND`, or `INVALID_TRANSITION`.

### Q101: What is an invalid transition?

Answer:

An invalid transition means the request is trying to move a record to a status that is not allowed. For example, an ambulance request cannot be assigned unless it is already approved.

### Q102: Why do you use status transitions?

Answer:

Status transitions protect the workflow. They make sure emergencies and ambulance requests follow the correct process and cannot skip important steps.

## 19. Legacy Routes

### Q103: What are `/api/alerts` and `/api/contacts`?

Answer:

Those are older simple route handlers still mounted for compatibility. The newer emergency workflow is in `/api/emergencies`, and the current user contact list is embedded in the `User` model.

### Q104: Why keep legacy routes?

Answer:

They may still support older frontend or mobile app behavior. Keeping them avoids breaking existing clients while the newer modules handle the main system workflow.

## 20. Testing And Quality

### Q105: Does the backend have tests?

Answer:

Yes. The backend uses Vitest. There are tests for schemas, JWT, geofence logic, responder role access, audit humanization, and admin schemas.

### Q106: How do you run backend tests?

Answer:

Use:

```bash
cd backend
npm test
```

### Q107: How do you check TypeScript errors?

Answer:

Use:

```bash
cd backend
npm run typecheck
```

### Q108: What does the lint script do?

Answer:

The backend currently uses strict TypeScript as its lint gate. The package script says lint is OK because there is no ESLint configuration.

## 21. Deployment

### Q109: How is the backend deployed?

Answer:

The backend can be deployed as a Node web service. The backend README gives Render deployment instructions. The root directory should be `backend`, the build command is `npm install && npm run build`, and the start command is `npm start`.

### Q110: What deployment environment variables are required?

Answer:

At minimum, the deployment needs `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV`, and optionally `CORS_ORIGINS` and `PORT`.

### Q111: What is the health check endpoint?

Answer:

The health check endpoint is:

```text
GET /api/health
```

It returns the backend status, timestamp, database label, and request ID.

## 22. Scenario Questions

### Q112: What happens if a user presses the emergency button?

Answer:

The app sends an emergency request to the backend. The backend validates the user token and request body, checks the location scope, creates an emergency record, logs the action, creates a notification, and sends real-time Socket.IO updates to admins and eligible responders.

### Q113: What happens if an admin assigns a responder to an emergency?

Answer:

The backend checks that the emergency exists and is still pending. It checks the responder exists and is approved. Then it changes the emergency status to `assigned`, stores the assigned responder ID, adds a timeline event, creates an audit log, emits a real-time event, and marks the responder as busy.

### Q114: What happens if a responder submits their live location?

Answer:

The backend saves a `LocationSample`, updates the responder's current location, stores a limited history in the responder document, and emits a live update to the admin dashboard.

### Q115: What happens if the same IoT event is submitted twice?

Answer:

The backend checks the `idempotencyKey`. If an emergency already exists for that device event, it returns the existing emergency instead of creating another one.

### Q116: What happens if an ambulance unit is already busy?

Answer:

The backend excludes busy units when checking availability. If an admin tries to assign a unit with a conflicting reservation, the backend returns a `UNIT_CONFLICT` error.

### Q117: What happens if a non-admin tries to access admin routes?

Answer:

The request passes through `authGuard` and `roleGuard('admin')`. If the role is not admin, the backend returns a `403 FORBIDDEN` error.

### Q118: What happens if the database connection fails?

Answer:

The backend startup fails or logs a database connection error. Since the backend depends on MongoDB for users, emergencies, and ambulance requests, it cannot properly operate without the database.

## 23. Possible Difficult Panel Questions

### Q119: Why should we trust your backend with emergency data?

Answer:

The backend uses authentication, role-based authorization, request validation, password hashing, refresh token hashing, MongoDB sanitization, rate limiting, audit logs, and controlled status transitions. These protect the data and make important actions traceable.

### Q120: What is the weakest part of the backend right now?

Answer:

A practical limitation is that some older routes like `/api/alerts` and `/api/contacts` still exist for compatibility and are simpler than the newer module-based routes. The main emergency workflow uses the newer `/api/emergencies` module, which has stronger validation, role checks, audit logs, and real-time event handling.

### Q121: What would you improve next?

Answer:

I would improve automated test coverage for full request workflows, add more integration tests for the database and Socket.IO events, strengthen monitoring and logging for production, and eventually retire or secure the older legacy routes if they are no longer needed.

### Q122: What happens if Socket.IO fails?

Answer:

The main database operation still completes because the service saves the record first. Socket.IO is used for real-time updates, so if it fails, the data is still in MongoDB and clients can still fetch updates through the API.

### Q123: Why use REST API plus Socket.IO instead of only one?

Answer:

REST API is reliable for normal operations like creating records, logging in, and fetching data. Socket.IO is better for live events like new emergencies, location updates, and notifications. Using both gives reliable storage and real-time updates.

### Q124: How do you make sure a responder cannot handle the wrong emergency type?

Answer:

The backend checks the responder's role, department, and agency type using `canResponderHandleEmergency()`. If the emergency type is outside the responder's allowed role, the backend blocks the action with a forbidden error.

### Q125: How do you make sure the ambulance workflow is followed?

Answer:

The service functions check the current status before changing it. For example, a request must be `approved` before assignment, must be `assigned` before `on_the_way`, and must be `patient_onboard` before completion.

### Q126: How do you avoid duplicate users?

Answer:

During registration, the backend checks for existing email addresses. For responders, it checks both email and badge ID. The Mongoose schemas also use unique indexes for important fields.

### Q127: Why is an audit log important in an emergency system?

Answer:

Because the system handles critical incidents, every major action should be traceable. Audit logs show who performed an action, when it happened, what target was affected, and extra metadata such as reason or notes.

### Q128: How do you know if an emergency happened outside Tanza?

Answer:

The backend uses a Tanza scope utility that checks the longitude and latitude. The emergency record stores `isInsideTanza` and `outsideScopeFlag`, so admins can identify out-of-scope requests.

### Q129: Can the backend still work if the frontend changes?

Answer:

Yes, as long as the frontend follows the API contract. The backend exposes REST endpoints and validates requests using schemas, so any client can use it if it sends the correct data and authorization token.

### Q130: How do you explain your backend architecture in one minute?

Answer:

The backend starts in `server.ts`, connects to MongoDB, creates the Express app from `app.ts`, and attaches Socket.IO. Express routes are grouped by modules like auth, emergencies, ambulance, BLE, locations, files, notifications, and admin. Protected routes use JWT authentication and role checks. Request data is validated by Zod, business logic is handled in service files, and records are saved using Mongoose models. Important actions create audit logs and Socket.IO events so the admin dashboard, users, and responders receive real-time updates.

## 24. Quick Memorization Points

- Entry point: `backend/src/server.ts`
- App setup: `backend/src/app.ts`
- Database connection: `connectDatabase()`
- Authentication middleware: `authGuard`
- Role middleware: `roleGuard`
- Validation middleware: `validateRequest`
- Custom errors: `AppError`
- Main auth functions: `registerUser`, `registerResponder`, `login`, `refresh`, `logout`, `changePassword`, `getMe`
- Main emergency functions: `createEmergency`, `listActive`, `assign`, `setOnTheWay`, `report`, `requestUpdate`, `resolve`
- Main ambulance functions: `createRequest`, `approve`, `reject`, `assign`, `setOnTheWay`, `setArrivedPickup`, `setPatientOnboard`, `complete`
- IoT functions: `pairDevice`, `processBleEvent`, `createFromIot`
- Location functions: `ingestUserLocation`, `ingestResponderLocation`, `getRespondersLive`
- Notification functions: `recordEmergencyNotification`, `recordAmbulanceNotification`
- Real-time events: Socket.IO rooms like `admin:live`, `user:<id>`, `responder:<id>`, `emergency:<id>`

## 25. Practice Closing Statement

If the panel asks you to summarize the backend, say:

```text
The SafeAlert backend is designed as a modular TypeScript Express API. It handles authentication, role-based access, emergency reporting, ambulance request management, BLE panic button integration, GPS location tracking, file uploads, audit logs, notifications, and real-time updates. The backend uses MongoDB through Mongoose for persistent storage and Socket.IO for live communication. Important workflows are protected by validation, authorization, audit logs, and controlled status transitions.
```

