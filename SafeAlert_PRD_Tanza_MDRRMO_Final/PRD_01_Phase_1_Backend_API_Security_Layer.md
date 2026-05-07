# PRD 01 - Phase 1 Backend and API Security Layer

**Project:** SafeAlert Emergency Response System  
**Folder:** `/SafeAlert_Workspace/backend`  
**Primary stack:** Node.js, Express, TypeScript, MongoDB Atlas, Mongoose, Socket.io  
**Status:** Implementation ready  
**Phase owner:** Backend developer

## Goal

Refactor and harden the existing backend so it can safely support the User mobile app, Responder mobile app, Admin Command Center and MDRRMO ambulance transport workflow. This phase is the foundation for all apps. Mobile and web clients must never connect directly to MongoDB Atlas. All emergency, ambulance request, identity document, location, approval and dispatch data must pass through authenticated, validated and rate limited API routes.


## Municipality scope constraint

SafeAlert production scope is limited to Tanza Municipality, Cavite. Backend geofencing, barangay selection, facility search, emergency records, responder coverage, ambulance transport workflows and analytics must default to Tanza only.

Rules:

- User registration must capture barangay and municipality or city.
- Tanza barangays are the official coverage list for priority, routing and analytics.
- Emergency and ambulance requests with GPS outside the Tanza boundary must be flagged as `outside_tanza_scope`.
- Outside scope requests are not auto-dispatched. Admin may review, reject, or manually coordinate through MDRRMO override if policy allows.
- Nearby facilities, OpenStreetMap defaults and analytics must use Tanza Municipality as the default map extent.

## Success criteria

- `package.json`, `tsconfig.json` and core database models exist in `/backend`.
- TypeScript is configured with `strict: true` and production code has zero `any` usage.
- `helmet` is enabled before routes.
- `express-rate-limit` protects login, registration, file upload, refresh token, emergency creation and admin action routes.
- Every write route uses centralized Zod validation before reaching controllers.
- User and Responder models include `isApproved: false` by default and `approvalStatus: pending` by default.
- User and Responder location history is capped to the last 100 points.
- Emergency lifecycle, ambulance transport lifecycle, audit logging and role based authorization are ready for the next phases.
- Ambulance transport requests support Emergency, Schedule and Transfer request types.
- Schedule and Transfer requests enforce the MDRRMO operating window of 3:00 PM to 7:00 PM and use real time physical ambulance availability, not fixed booking slots.
- The maximum ambulance capacity is 12 physical ambulance units.
- Schedule and Transfer requests may overlap as long as different physical ambulance units are available for the requested time range.
- Ambulance unit reservation happens only after admin approval and assignment.
- Emergency ambulance requests still require admin approval, but they are prioritized, visually highlighted and sorted above Schedule and Transfer requests.
- IoT keychain emergency triggers follow button press to User Mobile App to user profile and GPS attachment to backend to Admin Dashboard to OpenStreetMap marker.
- Backend enforces Tanza Municipality as the primary operational scope for emergency, ambulance, map, analytics and responder coverage.

## Scope

### In scope

- Backend project bootstrap.
- Environment validation using Zod.
- Express application security middleware.
- MongoDB Atlas connection through the backend only.
- Core Mongoose models.
- Centralized request validation middleware.
- Auth and role guard structure.
- Rate limiting strategy.
- API response and error contract.
- Indexes for security, performance and geospatial queries.
- Socket.io room naming contract.
- Ambulance transport request data model, availability rules and approval workflow.
- Ambulance unit assignment, user notification and responder transfer handoff workflow.
- Tanza Municipality geofence, barangay tagging, scope flagging and OpenStreetMap default extent.
- IoT keychain BLE emergency event intake through the User mobile app, including four dedicated button types.

### Out of scope

- Full Flutter UI implementation.
- Full React admin implementation.
- Production deployment.
- Firmware implementation for ESP32.

## Shared design reference to follow

All screens, states and UI components in this phase must follow the imported Figma design reference from `Design_Capstone.pdf`.

### Design tokens

| Token | Value | Required usage |
|---|---|---|
| Alert Red | `#DC2626` | Critical emergency actions, destructive confirmation, active incident urgency |
| Admin Navy | `#0F172A` | Admin sidebar, header, secure command center surfaces |
| Responder Blue | `#2563EB` | Responder actions, route actions, map controls, secondary CTAs |
| Success Green | `#16A34A` | Approved, connected, resolved, available |
| Warning Amber | `#F59E0B` | Pending, stale GPS, review required, caution states |
| Background | `#F8FAFC` | App and dashboard base background |
| Surface | `#FFFFFF` | Cards, panels, forms, dialogs |
| Border | `#CBD5E1` | Dividers, inputs, table borders |
| Text Strong | `#0F172A` | Main labels, headers, dashboard numbers |
| Text Muted | `#64748B` | Helper text, metadata, secondary labels |
| Soft Blue | `#DBEAFE` | Informational backgrounds, map highlights |
| Soft Red | `#FEE2E2` | Critical badge background, emergency alert card background |

### Typography

Use Inter as the primary font.

| Style | Size and weight | Usage |
|---|---|---|
| Display | 32px, 900 | Main dashboard and app hero headings |
| Heading | 24px, 800 | Screen titles |
| Title | 18px, 700 | Card titles, modal titles |
| Body | 16px, 400 | Main readable text |
| Caption | 12px, 700 | Labels, badges, metadata |

### Spacing and radius

- Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48`.
- Radius: `8px` for inputs, `12px` for buttons, `16px` for cards, `24px` for panels, `40px` for mobile shells.
- Touch targets must be at least 44px by 44px.
- Every async state must have loading, empty, error and success feedback.

### Required reusable components

- Navigation: Admin sidebar, mobile app bars and bottom navigation.
- Forms: Login, registration, create responder, dispatch and IoT pairing.
- Feedback: Modal, bottom sheet, toast, skeleton and empty state.
- Approval Card: ID proof, live face preview and approve or reject actions.
- IoT Device Card: Battery, signal and connection state.
- Map system: Incident pin, responder pin, route line and cluster.

## Required backend folder structure

```text
/backend
├── package.json
├── tsconfig.json
├── .env.example
├── src
│   ├── app.ts
│   ├── server.ts
│   ├── config
│   │   ├── env.ts
│   │   └── database.ts
│   ├── shared
│   │   ├── middleware
│   │   │   ├── validateRequest.ts
│   │   │   ├── authGuard.ts
│   │   │   ├── roleGuard.ts
│   │   │   ├── rateLimiters.ts
│   │   │   └── errorHandler.ts
│   │   ├── types
│   │   └── utils
│   ├── models
│   │   ├── User.ts
│   │   ├── Responder.ts
│   │   ├── Emergency.ts
│   │   ├── LocationSample.ts
│   │   ├── BleDevice.ts
│   │   ├── AmbulanceTransportRequest.ts
│   │   ├── AmbulanceUnit.ts
│   │   └── AuditLog.ts
│   └── modules
│       ├── auth
│       ├── users
│       ├── responders
│       ├── emergencies
│       ├── ambulanceTransport
│       ├── ambulanceUnits
│       ├── locations
│       ├── approvals
│       ├── admin
│       ├── analytics
│       └── audit
└── tests
```

## Generated starter files

This PRD package includes these actual starter files:

- `/backend/package.json`
- `/backend/tsconfig.json`
- `/backend/src/models/User.ts`
- `/backend/src/models/Responder.ts`
- `/backend/src/models/Emergency.ts`
- `/backend/src/models/LocationSample.ts`
- `/backend/src/models/BleDevice.ts`
- `/backend/src/models/AmbulanceTransportRequest.ts`
- `/backend/src/models/AmbulanceUnit.ts`
- `/backend/src/models/AuditLog.ts`

## Security requirements

### Middleware order

1. Request ID middleware.
2. `helmet`.
3. CORS whitelist.
4. Body parser with JSON size limit.
5. Mongo sanitize middleware.
6. Route scoped rate limiter.
7. Authentication middleware for protected routes.
8. Role guard middleware.
9. Zod validation middleware.
10. Controller.
11. Error handler.

### Rate limit groups

| Route group | Limit | Key strategy |
|---|---:|---|
| Login | 5 failed attempts per 15 minutes | IP plus normalized email |
| Registration | 10 attempts per hour | IP |
| Emergency creation | 10 attempts per minute | Auth user ID plus IP fallback |
| Ambulance transport request creation | 6 attempts per minute | Auth user ID plus IP fallback |
| Ambulance availability check | 60 attempts per minute | Auth user ID plus IP fallback |
| File upload | 20 uploads per hour | Auth account ID |
| Refresh token | 30 attempts per hour | Account ID plus IP |
| Admin actions | 60 actions per minute | Admin ID |

### Validation policy

- No controller may read raw `req.body`.
- Zod schemas must parse `body`, `params`, `query` and selected headers.
- Validated data must be assigned to a typed `req.validated` object or passed as a typed argument to controllers.
- Unknown fields must be rejected for write endpoints unless a schema explicitly strips them.
- All file metadata must be validated by extension, MIME type, file size and magic bytes.

### Authentication and authorization

- Use short lived access tokens and refresh tokens.
- Refresh tokens must be stored hashed.
- No fallback JWT secret is allowed.
- Pending or rejected accounts cannot log in.
- `admin`, `responder` and `user` route access must be separate.
- Admin credentials must be seeded from environment variables, hashed and never committed in plaintext.

## Core data model requirements

### User

- `role: user`.
- `isApproved: false` by default.
- `approvalStatus: pending` by default.
- Stores `proofOfResidencyFileId` and `faceCaptureFileId`.
- Stores only last 100 `locationHistory` points.
- Includes audit friendly fields: `approvedAt`, `approvedBy`, `rejectedAt`, `rejectedBy` and `rejectionReason`.

### Responder

- `role: responder`.
- `isApproved: false` by default.
- `approvalStatus: pending` by default.
- Stores `agencyType`, `stationName`, `position`, `coverageArea`, `credentialFileId` and `faceCaptureFileId`.
- Stores `dutyStatus` as `off_duty`, `on_duty` or `busy`.
- Stores only last 100 `locationHistory` points.

### Emergency

- Stores emergency type, priority, source, status, current location, assigned responder, timeline and idempotency key.
- Only Admin can set `resolved`.
- Responder can set `responder_on_the_way` only when assigned.
- User can cancel only before assignment.

### Location samples

- Store detailed GPS samples in a separate collection.
- Use indexes by `emergencyId`, `actorId`, `actorType` and `capturedAt`.
- Use retention policy or TTL when allowed.

### IoT keychain devices

- Stores ESP32 BLE keychain bindings using `BleDevice`.
- Each active keychain can be bound to only one approved user account.
- Stores device ID, firmware version, BLE service UUID, battery percentage, last seen time, last RSSI, switch state when reported, pairing status and revoked status.
- Hardware has four dedicated emergency buttons: `crime`, `fire`, `medical` and `general_sos`.
- Hardware has one physical on or off switch and one LED indicator for power, connection, sending and low battery states.
- Pressing a keychain button does not send emergency details directly to admin or backend.
- The keychain sends only a BLE trigger to the paired User mobile app: device ID, event ID, selected button type, battery level, firmware version and device timestamp.
- The User mobile app attaches the registered user profile, type of accident, full name, age, face photo, phone GPS location, blood type and emergency contact person before sending to the backend.
- Emergency events from the keychain use `source: iot_keychain`.
- The backend must use `deviceId`, `eventId` and user ID for idempotency so repeated BLE notifications do not create duplicate emergencies.
- Lost, stolen or replaced keychains can be revoked by the user or admin.
- IoT alerts inherit the same Tanza Municipality geofence and outside scope flagging as app button alerts.


### AmbulanceTransportRequest

- Stores request type: `emergency`, `schedule` or `transfer`.
- Stores request status: `pending_review`, `approved`, `rejected`, `assigned`, `on_the_way`, `arrived_pickup`, `patient_onboard`, `completed` or `cancelled`.
- Stores sender user ID and snapshots of registered information required for review: full name, proof of indigency file ID, valid ID file ID, age, date of birth, blood type and face capture file ID.
- Stores patient information from the transport form: patient full name, address, contact number, medical condition, special requirements and accompanying person details.
- Stores pickup location and drop off location as GeoJSON points with human readable address labels.
- Stores Schedule or Transfer requested date, requested time, estimated pickup duration and estimated transport duration when available.
- Enforces 3:00 PM to 7:00 PM operating window only for Schedule and Transfer.
- Does not reserve an ambulance during submission or pending review.
- Reserves a physical ambulance only after admin approval and assignment.
- Allows overlapping Schedule and Transfer requests when different physical ambulance units are available for the same time range.
- Stores priority flags: `isEmergencyPriority`, `isTanzaCitizenPriority` and `requiresImmediateReview`.
- Requires proof of indigency file reference and stores Tanza citizen priority fields: municipality, barangay, proof of residency when available and citizen priority decision.
- Allows Emergency request type to bypass the Schedule and Transfer operating window, but not admin approval or audit logging.
- Stores admin review fields: reviewedAt, reviewedBy, rejectionReason, approval notes and priority decision.
- Stores assignment fields: selected ambulance unit, assigned responder, assigned driver where available and assignment timestamp.
- Stores timeline events for created, approved, rejected, assigned, on the way, arrived, completed and cancelled.

### AmbulanceUnit

- Stores ambulance number from 1 to 12.
- Stores availability status: `available`, `assigned`, `maintenance` or `out_of_service`.
- Stores assigned responder or driver reference when applicable.
- Stores current assignment ID, active request ID, latest known location and assignment time range.
- Supports filtering by real time availability, requested time range, maintenance status and duty status.

## Required API modules

### Auth

```text
POST /api/auth/register/user
POST /api/auth/register/responder
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### Admin approvals

```text
GET  /api/admin/registrations?type=user|responder&status=pending
GET  /api/admin/registrations/:id
POST /api/admin/registrations/:id/approve
POST /api/admin/registrations/:id/reject
```

### Emergencies

```text
POST /api/emergencies
GET  /api/emergencies/active
GET  /api/emergencies/my
GET  /api/emergencies/:id
POST /api/emergencies/:id/cancel
POST /api/emergencies/:id/assign
POST /api/emergencies/:id/on-the-way
POST /api/emergencies/:id/report
POST /api/admin/emergencies/:id/resolve
```

### Locations and BLE

```text
POST /api/locations/user
POST /api/locations/responder
GET  /api/emergencies/:id/location-history
GET  /api/responders/locations/live
GET  /api/ambulance-requests/:id/location-history
POST /api/user/ble-devices/pair
GET  /api/user/ble-devices
POST /api/user/ble-devices/:id/unpair
POST /api/user/ble-events
POST /api/emergencies/from-iot
```

### Ambulance transport

```text
POST /api/ambulance-requests
GET  /api/ambulance-requests/my
GET  /api/ambulance-requests/:id
POST /api/ambulance-requests/:id/cancel
GET  /api/ambulance-availability?type=schedule|transfer&startAt=ISO_DATETIME&endAt=ISO_DATETIME
GET  /api/admin/ambulance-requests?status=pending_review|approved|assigned|completed
GET  /api/admin/ambulance-requests/:id
POST /api/admin/ambulance-requests/:id/approve
POST /api/admin/ambulance-requests/:id/reject
GET  /api/admin/ambulance-units/available?requestId=:id&startAt=ISO_DATETIME&endAt=ISO_DATETIME
POST /api/admin/ambulance-requests/:id/assign
POST /api/responder/ambulance-requests/:id/on-the-way
POST /api/responder/ambulance-requests/:id/arrived-pickup
POST /api/responder/ambulance-requests/:id/patient-onboard
POST /api/responder/ambulance-requests/:id/complete
```

Rules:

- User creates the transport form from the mobile app.
- Admin reviews the sender profile and the form side by side.
- Approved requests disappear from the pending approval table and become available in analytics and records.
- On approval, AdminWeb must show available physical ambulance units from 1 to 12.
- The backend calculates availability from active assignments and out of service or maintenance status.
- If all 12 physical ambulances are assigned or unavailable during the requested time range, the backend returns a no availability response for Schedule and Transfer.
- Emergency requests are marked critical and placed at the top of the admin approval queue, but still need admin approval, dispatch assignment and audit logging.
- Assigned request details are pushed to the selected responder mobile app with pickup and drop off route data.



## IoT emergency data flow

The backend must support this exact IoT emergency flow:

```text
IoT Keychain Button Press
-> User Mobile App receives BLE signal
-> User Mobile App identifies emergency type
-> User Mobile App attaches user profile and phone GPS
-> Backend validates and stores complete emergency request
-> Admin Dashboard receives real time alert
-> OpenStreetMap shows sender GPS marker
-> Admin clicks marker to view user information
```

The keychain must never be treated as a direct internet sender. The mobile app is the authenticated sender and the backend must validate that the device belongs to the authenticated user.

Required emergency snapshot fields for IoT alerts:

- Type of accident: Medical, Crime, Fire or General SOS.
- Full name.
- Age.
- Face photo reference.
- Phone GPS latitude, longitude, accuracy and timestamp.
- Blood type.
- Emergency contact person and emergency contact number.
- Source device ID.
- Device battery at trigger.
- Tanza scope flag and barangay when available.

## Zod validation examples

### Create emergency schema

```ts
import { z } from "zod";

export const createEmergencySchema = z.object({
  type: z.enum(["medical", "crime", "fire", "general_sos"]),
  source: z.enum(["mobile_app", "iot_keychain"]),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90)
    ]),
    accuracyMeters: z.number().min(0).max(5000),
    capturedAt: z.string().datetime()
  }),
  notes: z.string().trim().max(500).optional(),
  bleEventId: z.string().trim().max(100).optional(),
  sourceDeviceId: z.string().trim().max(100).optional(),
  buttonType: z.enum(["medical", "crime", "fire", "general_sos"]).optional(),
  deviceBatteryAtTrigger: z.number().min(0).max(100).optional(),
  isInsideTanza: z.boolean().optional(),
  barangay: z.string().trim().max(120).optional()
}).strict();
```

### Create ambulance transport request schema

```ts
import { z } from "zod";

const geoPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90)
  ]),
  addressLabel: z.string().trim().min(3).max(250),
  accuracyMeters: z.number().min(0).max(5000).optional()
}).strict();

export const createAmbulanceTransportRequestSchema = z.object({
  requestType: z.enum(["emergency", "schedule", "transfer"]),
  patient: z.object({
    fullName: z.string().trim().min(2).max(120),
    address: z.string().trim().min(5).max(250),
    contactNumber: z.string().trim().min(7).max(20),
    medicalCondition: z.string().trim().min(2).max(500),
    specialRequirements: z.string().trim().max(500).optional()
  }).strict(),
  accompanyingPerson: z.object({
    fullName: z.string().trim().min(2).max(120),
    contactNumber: z.string().trim().min(7).max(20)
  }).strict().optional(),
  pickupLocation: geoPointSchema,
  dropOffLocation: geoPointSchema,
  requestedDate: z.string().date().optional(),
  requestedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  transferDetails: z.object({
    originHospitalName: z.string().trim().max(180).optional(),
    destinationHospitalName: z.string().trim().max(180).optional(),
    referringDoctor: z.string().trim().max(120).optional()
  }).strict().optional(),
  notes: z.string().trim().max(500).optional()
}).strict().superRefine((value, ctx) => {
  if (value.requestType !== "emergency") {
    if (!value.requestedDate || !value.requestedTime) {
      ctx.addIssue({ code: "custom", message: "Requested date and time are required for Schedule and Transfer." });
    }
    if (value.requestedTime && (value.requestedTime < "15:00" || value.requestedTime > "19:00")) {
      ctx.addIssue({ code: "custom", message: "Schedule and Transfer are allowed only from 3:00 PM to 7:00 PM." });
    }
  }
});
```


### Validated controller rule

```ts
export async function createEmergencyController(req: ValidatedRequest<CreateEmergencyInput>, res: Response): Promise<void> {
  const input = req.validated.body;
  const emergency = await emergencyService.createEmergency(input, req.auth);
  res.status(201).json({ data: emergency });
}
```

## Socket.io event contract

Rooms:

```text
user:{userId}
responder:{responderId}
admin:live
emergency:{emergencyId}
agency:{agencyType}:{coverageArea}
```

Events:

```text
emergency.created
emergency.iot_keychain_created
emergency.updated
emergency.assigned
emergency.responder_on_the_way
emergency.responder_nearby
emergency.resolved
location.user_updated
location.responder_updated
registration.created
registration.reviewed
ambulance_request.created
ambulance_request.reviewed
ambulance_request.assigned
ambulance_request.on_the_way
ambulance_request.completed
ambulance_availability.updated
```

## Acceptance criteria

- `npm run typecheck` passes with strict TypeScript.
- `grep -R "any" src` returns no production usage.
- Starting production backend without required secrets fails fast.
- A sixth failed login attempt returns HTTP 429.
- Invalid emergency type returns HTTP 400 before controller execution.
- Invalid ambulance request type returns HTTP 400 before controller execution.
- Schedule or Transfer outside 3:00 PM to 7:00 PM returns HTTP 400.
- Schedule or Transfer request does not reserve an ambulance while pending review.
- Schedule or Transfer request is approved only when at least one physical ambulance unit is available for the requested time range.
- Overlapping Schedule or Transfer requests are allowed when different physical ambulance units are available.
- Emergency ambulance request is sorted as highest priority and remains subject to admin approval, assignment and audit logging.
- IoT keychain alert creates an emergency only after the User mobile app adds registered user profile and phone GPS data.
- Admin map marker payload includes type of accident, full name, age, face, location, blood type and emergency contact person.
- Requests outside Tanza Municipality are flagged and cannot be auto-dispatched without admin override.
- Pending user login returns HTTP 403.
- Approved user login succeeds.
- Responder cannot resolve an emergency.
- User and Responder location history stays at 100 points after 101 or more updates.
- Active emergency query uses indexed fields.
- All admin approval, rejection and resolution actions create audit log entries.

## Phase 1 exit checklist

- [ ] Backend project created.
- [ ] `package.json` added.
- [ ] `tsconfig.json` added with strict mode.
- [ ] Core models added.
- [ ] Zod validation middleware added.
- [ ] Helmet added.
- [ ] Express rate limit added.
- [ ] CORS whitelist added.
- [ ] Auth guard added.
- [ ] Role guard added.
- [ ] Error handler added.
- [ ] Audit log service added.
- [ ] Emergency lifecycle service added.
- [ ] Ambulance transport request lifecycle service added.
- [ ] Ambulance availability and 12 physical unit rule verified.
- [ ] Location history truncation verified.
- [ ] Backend tests for auth, validation, rate limit and lifecycle pass.
