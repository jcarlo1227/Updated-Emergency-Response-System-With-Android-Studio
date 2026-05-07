# PRD 04 - Phase 4 Admin Command Center React

**Project:** SafeAlert Emergency Response System  
**Folder:** `/SafeAlert_Workspace/web_admin`  
**Primary stack:** React, TypeScript, Vite, React Query, Zod, React Hook Form, Leaflet, Socket.io  
**Status:** Implementation ready  
**Phase owner:** Frontend web developer

## Goal

Build the web based command center for administrators. The dashboard must handle secure admin login, approval queues, MDRRMO ambulance transport review, live map monitoring, responder dispatch, emergency resolution, analytics, records and audit logs.


## Municipality scope constraint

AdminWeb is scoped to Tanza Municipality, Cavite. The default dashboard, OpenStreetMap view, barangay analytics, responder coverage and ambulance request review must center on Tanza only.

Rules:

- Default map viewport is Tanza Municipality.
- Barangay filters use Tanza barangays.
- Emergency and ambulance records must show whether the GPS point is inside or outside Tanza.
- Outside Tanza cases must show a warning badge and require admin decision or inter-agency coordination.
- Reports must separate Tanza cases from outside scope records.

## Success criteria

- Admin can log in using seeded admin credentials from backend environment configuration.
- Admin can review users and responders in an Approval Center.
- Admin can view ID proof, face captures and responder credentials.
- Admin can approve or reject accounts.
- Admin can create new responders from the Responders module.
- Admin can dispatch by viewing all available responders with role, field, area, distance and active load.
- Admin can review, approve or reject ambulance transport forms from a dedicated navbar module.
- Admin can view sender registered information beside the ambulance transport form during review.
- Admin can see the 12 physical ambulance units, their real time availability and choose an available ambulance or responder after approval.
- Approved ambulance requests leave the pending table and update analytics.
- Admin can view all active emergencies and responders on OpenStreetMap, centered on Tanza Municipality by default.
- Admin is the only role that can mark emergency as resolved.
- Analytics reports generate monthly rates, response times and demographics.
- Approval Center appears before Reports in the navigation sequence.
- IoT keychain alerts appear as critical map markers and clickable emergency records, but only after the User mobile app sends the complete user and GPS payload.

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

## Required folder structure

```text
/web_admin
├── src
│   ├── app
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── components
│   │   ├── layout
│   │   └── ui
│   ├── features
│   │   ├── auth
│   │   ├── dashboard
│   │   ├── responders
│   │   ├── incidents
│   │   ├── dispatch
│   │   ├── ambulance_requests
│   │   ├── map
│   │   ├── approvals
│   │   ├── reports
│   │   ├── audit
│   │   └── settings
│   ├── services
│   │   ├── apiClient.ts
│   │   └── socketClient.ts
│   ├── styles
│   └── types
├── package.json
├── tsconfig.json
└── .env.example
```

## Navigation sequence

The sidebar sequence must match the updated design reference:

```text
Overview
Incidents
Responders
Dispatch
Ambulance Requests
Map
Approval Center
Reports
Audit Logs
Settings
```

Note: Approval Center must be placed before Reports. Ambulance Requests must be a separate navbar item because MDRRMO transport approval is a workflow separate from account approval.

## Screens

### 1. Admin login

- Secure login card.
- Admin Navy background section.
- Email or username field.
- Password field.
- Sign in button.
- Uses backend login endpoint.
- Credentials must not be hardcoded in frontend production code.

### 2. Overview dashboard

Cards:

- Active Alerts.
- Average Response.
- Available Units.
- Critical Queue.

Panels:

- Live Incident Map.
- Response Load by unit role.
- Recent Incidents.
- System Online status.

### 3. Responders

- Responder Directory table.
- Search by name, role, field and area.
- Status filters: Available, Busy, Off Duty, Pending.
- Create Responder form.
- Fields: Full name, role, field, phone, badge ID, station and coverage area.
- Save Responder action creates pending or approved based on admin rule.

### 4. Live incidents

- Active incident queue.
- Table columns: ID, Type, Source, Priority, Location, Tanza Scope, Status and Action.
- Filters: All, Critical, Medical, Fire, Police, Rescue and Unassigned.
- Actions: Dispatch, Track and Open.

### 5. Dispatch responder

- Incident summary: ID, type, location, required role and required field.
- Shows all available responders.
- Each responder card or row shows name, role, field, area, distance and active load.
- Filter by role.
- Assign action.
- Confirmation modal before assigning.

### 6. Ambulance Requests

Purpose:

- Review and approve MDRRMO ambulance transport forms submitted from the User mobile app.

Pending table:

- Columns: Request ID, Request type, Patient name, Sender name, Requested date, Requested time, Pickup, Drop off, Submitted at and Action.
- Filters: Emergency, Schedule, Transfer, Pending review, Approved, Rejected, Assigned, On the way and Completed.
- Search by patient name, sender name, pickup location, drop off location or request ID.
- Emergency requests must show an Alert Red critical badge, float to the top of the queue and stay visually different until reviewed by admin.

Detail view:

- Two column layout.
- Left column shows sender registered information: full name, proof of indigency, valid ID, age, date of birth, blood type, face capture, barangay, municipality and Tanza priority badge.
- Right column shows ambulance transport form: request type, patient details, medical condition, special requirements, accompanying person, pickup location, drop off location, requested date and requested time.
- Map preview shows pickup and drop off pins.
- Actions: Approve, Reject and View audit trail.
- Reject requires a reason.

Approval and assignment workflow:

- After approval, show available physical ambulance units numbered 1 to 12.
- Admin selects an available ambulance unit and responder or driver if assigned in the system.
- Assignment transfers the approved form data to the selected responder mobile app.
- User receives notification when approved, assigned and on the way.
- A Schedule or Transfer request reserves the selected physical ambulance only after admin approval and assignment.
- Overlapping Schedule and Transfer requests are allowed when different ambulance units are available for the same requested time range.
- If all 12 physical ambulances are assigned, in maintenance or out of service for the requested time range, AdminWeb must show no availability and prevent approval until a unit becomes available or the schedule is changed.
- Emergency request type bypasses the Schedule and Transfer operating window, but must still be approved, dispatched and audited.

Analytics behavior:

- Approved requests disappear from Pending table.
- Approved, rejected, assigned and completed requests remain searchable in records.
- Analytics updates request counts by type, approval rate, rejection rate, ambulance utilization and average dispatch time.

### 7. Map Center

- OpenStreetMap live GPS view.
- Default viewport and boundary overlay must be Tanza Municipality, Cavite.
- Layers: Active Alerts, IoT Keychain Alerts, Responders, Ambulance Units, Hospitals, Police, Fire Stations and Risk Zones.
- Incident pin, responder pin, ambulance pin, route line and clusters.
- Each sender GPS location must display an emergency marker at the coordinates provided by the User mobile app.
- Marker icon must reflect emergency type: Crime, Fire, Medical or General SOS.
- IoT keychain markers must display an `IoT Keychain` badge and critical visual emphasis.
- Clicking an emergency marker opens a right side detail drawer.
- Detail drawer displays type of accident, full name, age, face photo, GPS location, blood type, emergency contact person, contact number, source, device battery if IoT and Tanza scope status.
- Outside Tanza markers must show an `Outside Tanza Scope` warning and require admin decision before dispatch.


### 8. Approval Center

- Separate tabs: User and Responder.
- Cards show applicant name, role, ID proof, live face and credential proof if responder.
- Actions: Approve and Reject.
- Reject requires a reason.
- Admin document viewing is audit logged.

### 9. Reports

- Export Center.
- Daily Incident Report.
- Responder Performance.
- Ambulance Transport Requests by type.
- Ambulance ambulance utilization.
- Ambulance approval and rejection trend.
- Barangay Risk Summary.
- Response Time Trend.
- Format options: PDF and CSV.
- Incident breakdown chart.

### 10. Audit Logs

- Search.
- Filter by actor, action and date.
- Table: Timestamp, Actor, Action, Target and Details.
- Export option.

### 11. Settings

- Emergency categories.
- Coverage areas.
- Facility source configuration.
- Report templates.
- Admin profile.

## Functional requirements

### Admin auth

- Admin login uses backend endpoint.
- Frontend stores access token only in approved client storage strategy.
- Routes are protected.
- Session expiry redirects to login.

### Approval queue

- Admin can approve or reject users.
- Admin can approve or reject responders.
- Document previews must use authenticated protected routes or signed URLs.
- Every approval, rejection and document view creates an audit log.

### Emergency map and IoT alerts

- Admin Dashboard receives emergency alerts only from the backend, not directly from the keychain.
- IoT keychain alert flow must show as `Keychain Button -> User Mobile App -> Backend -> Admin Dashboard -> OpenStreetMap`.
- Admin can click the OpenStreetMap marker to inspect full sender details.
- The clicked marker detail must include type of accident, full name, age, face, location, blood type and emergency contact person.
- Admin can dispatch only after reviewing the emergency case.

### Dispatch

- Dispatch view must show all available responders.
- The list must include role, field, area, distance and active load.
- Admin can assign responder.
- Assignment update broadcasts to User and Responder apps.

### Ambulance request review

- Admin can review pending ambulance transport requests.
- Admin detail view must show sender information beside the transport form.
- Admin can approve or reject a transport request.
- Reject requires a reason and notifies the user.
- Approved Schedule and Transfer requests reserve one physical ambulance for the assigned time range.
- Emergency requests appear in utilization analytics as priority emergency transport and remain part of physical ambulance usage once assigned.
- After approval, AdminWeb displays available ambulance units and responders for assignment.
- Assignment broadcasts the request data to the selected responder mobile app.
- On the way status updates User app and AdminWeb through Socket.io.


### Resolution control

- Only AdminWeb displays Resolve action.
- Resolve requires responder report or admin override reason.
- Resolved emergency leaves live map and appears in records.
- Resolution updates analytics.

### Analytics engine

- Monthly emergency rate by type.
- Average response time.
- Average resolution time.
- Demographics if legally collected and approved.
- Responder workload.
- Approval trends.
- Export to PDF and CSV.

## API dependencies

| Need | Endpoint |
|---|---|
| Admin login | `POST /api/auth/login` |
| Current admin | `GET /api/auth/me` |
| Pending registrations | `GET /api/admin/registrations` |
| Registration detail | `GET /api/admin/registrations/:id` |
| Approve | `POST /api/admin/registrations/:id/approve` |
| Reject | `POST /api/admin/registrations/:id/reject` |
| Active emergencies | `GET /api/emergencies/active` |
| IoT emergency detail | `GET /api/admin/emergencies/:id` |
| Assign responder | `POST /api/emergencies/:id/assign` |
| Resolve emergency | `POST /api/admin/emergencies/:id/resolve` |
| Pending ambulance requests | `GET /api/admin/ambulance-requests` |
| Ambulance request detail | `GET /api/admin/ambulance-requests/:id` |
| Approve ambulance request | `POST /api/admin/ambulance-requests/:id/approve` |
| Reject ambulance request | `POST /api/admin/ambulance-requests/:id/reject` |
| Available ambulance units | `GET /api/admin/ambulance-units/available` |
| Assign ambulance request | `POST /api/admin/ambulance-requests/:id/assign` |
| Live responder locations | `GET /api/responders/locations/live` |
| Analytics summary | `GET /api/admin/analytics/summary` |
| Monthly analytics | `GET /api/admin/analytics/monthly` |
| Records | `GET /api/admin/records/emergencies` |
| Audit logs | `GET /api/admin/audit-logs` |

## Real-time dependencies

Subscribe to:

```text
registration.created
registration.reviewed
emergency.created
emergency.iot_keychain_created
emergency.updated
emergency.assigned
emergency.responder_on_the_way
emergency.resolved
ambulance_request.created
ambulance_request.reviewed
ambulance_request.assigned
ambulance_request.on_the_way
ambulance_request.completed
location.user_updated
location.responder_updated
```

## Type safety requirements

- Use TypeScript strict mode.
- No production `any`.
- API DTOs must be typed.
- Forms use `react-hook-form` plus `zod`.
- React Query responses must be typed.
- Socket events must use typed payload interfaces.

## Acceptance criteria

- Admin login works through backend.
- Admin navigation order matches design reference with Approval Center before Reports.
- Admin can approve user from Approval Center.
- Admin can reject responder with reason.
- Approved account can log in immediately.
- Create Responder exists in Responders module.
- Dispatch screen shows all available responders with role and field.
- Ambulance Requests appears as its own navbar item.
- Admin can open a pending ambulance request and view sender information beside the form.
- Admin can approve or reject an ambulance transport request.
- Admin can select from available ambulance units numbered 1 to 12 after approval.
- Active emergency appears on map within 3 seconds.
- IoT keychain emergency appears on the OpenStreetMap marker after the User mobile app attaches profile and GPS data.
- Clicking the emergency marker displays type of accident, full name, age, face, location, blood type and emergency contact person.
- Default map, analytics and filters are scoped to Tanza Municipality.
- Resolve action exists only in AdminWeb.
- Resolved emergency moves to records and updates analytics.
- Audit log appears for approval, rejection, dispatch and resolve.
- Dashboard is responsive on desktop, tablet and mobile.
- `npm run typecheck`, `npm run lint` and `npm run build` pass.

## Phase 4 exit checklist

- [ ] React Vite project created.
- [ ] Theme tokens implemented from design reference.
- [ ] Admin login implemented.
- [ ] Protected routes implemented.
- [ ] Overview dashboard implemented.
- [ ] Responders module with Create Responder implemented.
- [ ] Live Incidents module implemented.
- [ ] Dispatch module implemented with role and field visibility.
- [ ] Ambulance Requests module implemented.
- [ ] Ambulance request review, approval, rejection and assignment implemented.
- [ ] Ambulance 12 physical unit availability panel implemented.
- [ ] Map Center implemented.
- [ ] Approval Center implemented before Reports.
- [ ] Reports and analytics implemented.
- [ ] Emergency records implemented.
- [ ] Audit logs implemented.
- [ ] Resolve workflow implemented.
- [ ] Socket.io live updates implemented.
- [ ] Tests pass.
