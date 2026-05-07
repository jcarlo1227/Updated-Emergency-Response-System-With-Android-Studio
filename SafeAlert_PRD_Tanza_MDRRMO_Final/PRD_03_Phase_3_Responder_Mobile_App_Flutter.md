# PRD 03 - Phase 3 Responder Mobile App Flutter

**Project:** SafeAlert Emergency Response System  
**Folder:** `/SafeAlert_Workspace/android_studio/MobileForResponder`  
**Primary stack:** Flutter, Dart, Riverpod, Dio, flutter_map, geolocator, Android intents  
**Status:** Implementation ready  
**Phase owner:** Flutter mobile developer

## Goal

Build the specialized Flutter app for approved emergency responders. The app must support credential based registration, map centered active emergency feeds, MDRRMO ambulance transport assignments, one tap navigation, responder on the way status management and live GPS broadcast while assigned or on duty.


## Municipality scope constraint

The Responder mobile app is scoped to Tanza Municipality, Cavite.

Rules:

- Responders are assigned to Tanza coverage areas or barangays.
- The active emergency map defaults to Tanza.
- Assigned cases outside the Tanza boundary must display an outside scope warning.
- Responder visibility must prioritize incidents inside Tanza unless admin explicitly assigns an outside scope case.

## Success criteria

- Responder can register with role specific credential uploads.
- Admin approval is required before login access.
- Responder can toggle on duty.
- Active emergencies appear on a Tanza centered map and can be filtered by type, status, distance and priority.
- Responder can open emergency details and start route guidance.
- Responder can mark `responder_on_the_way`.
- Responder cannot mark emergencies as resolved.
- Live GPS broadcast runs only when on duty or assigned to active emergency.
- Responder can submit field report for admin review.
- Assigned responder can receive approved ambulance transport form details with pickup and drop off locations.
- Responder can navigate to pickup, then to drop off, using the fastest available route.
- Responder can update ambulance request status to on the way, arrived at pickup, patient onboard and completed.
- Emergency ambulance assignments display a critical priority banner and remain pinned above Schedule and Transfer assignments until acknowledged.
- IoT keychain emergencies display the same emergency details as app emergencies, plus source device and battery at trigger.
- Responder workflow defaults to Tanza Municipality coverage only.

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
/MobileForResponder
├── lib
│   ├── core
│   │   ├── config
│   │   ├── networking
│   │   ├── routing
│   │   ├── storage
│   │   ├── theme
│   │   └── widgets
│   ├── features
│   │   ├── auth
│   │   ├── registration
│   │   ├── duty_status
│   │   ├── emergency_map
│   │   ├── emergency_detail
│   │   ├── ambulance_assignments
│   │   ├── route_guidance
│   │   ├── location_sharing
│   │   ├── response_reports
│   │   ├── notifications
│   │   └── settings
│   └── main.dart
├── android
├── test
└── pubspec.yaml
```

## Required screens

### 1. Splash and startup check

- Checks session, approval status, location permission, notification permission and service status.
- Routes to Login, Pending Approval, Duty Status or Active Emergency Map.

### 2. Login

- Email.
- Password.
- Remember Me.
- Login button.
- Error state for pending approval and rejected account.

### 3. Responder registration

Fields:

- Full name.
- Date of birth and computed age.
- Contact number.
- Email.
- Password and confirm password.
- Agency type: Police, Fire, Medical, Rescue or Other.
- Station or department name.
- Position or field role.
- Coverage area.
- Credential number where applicable.
- Professional credential upload.
- Live face capture.
- Consent for emergency location tracking while on duty.

### 4. Pending approval

- Explains that responder credentials are under review.
- Shows submitted, reviewing and approved timeline.
- Contact admin link for urgent onboarding.

### 5. On duty status

- Large on duty toggle.
- Current duty time.
- Current GPS status.
- Warning if location permission is not granted.
- Status colors: green for on duty, amber for stale GPS, muted gray for off duty.

### 6. Active emergency map

- OpenStreetMap centered on responder location with Tanza Municipality as the default viewport.
- Markers for active emergencies.
- Filter chips: All, Crime, Fire, Medic and SOS.
- Status filter: New, Assigned and On the Way.
- Priority filter: Critical, High and Medium.
- Distance sort.
- Marker tap opens detail bottom sheet.

### 7. Emergency detail bottom sheet

- Emergency type and priority badge.
- Victim or sender name.
- Phone number.
- Age when available.
- Face photo when authorized for emergency verification.
- Blood type when available.
- Emergency contact person and number.
- Location and accuracy.
- Source badge: Mobile App or IoT Keychain.
- Device battery at trigger when source is IoT Keychain.
- Notes.
- Created timestamp.
- Current status.
- Route button.
- On the way button when allowed.

### 8. Ambulance assignment detail

- Shows request type: Emergency, Schedule or Transfer.
- Shows patient information needed by the responder: patient name, contact number, medical condition, special requirements and accompanying person.
- Shows sender information only when required for transport verification.
- Shows pickup location and drop off location with address labels and map pins.
- Shows scheduled date and time for Schedule and Transfer.
- Shows assigned ambulance unit number if provided by admin.
- Actions: On the way, Arrived at pickup, Patient onboard and Complete transport.
- Emergency ambulance assignment must be visually marked as critical.

### 9. Ambulance route guidance

- Route line shown on OpenStreetMap.
- Route to pickup first.
- After arrived at pickup, route to drop off location.
- One tap external navigation intent to Waze or Google Maps.
- ETA and distance for both route legs.
- Fastest route is requested from the backend route endpoint.

### 10. Route guidance

- Route line shown on OpenStreetMap.
- One tap external navigation intent to Waze or Google Maps.
- ETA and distance.
- Near arrival alert when within configured radius.
- Report arrival or response button.

### 11. Response report form

- Arrival timestamp.
- Situation notes.
- Action taken.
- People assisted.
- Notes to admin.
- Optional photo upload if enabled.
- Submit report button.

### 12. Notifications

- New emergency in coverage area.
- Assigned emergency.
- Assigned ambulance transport request.
- Route or proximity alert.
- Admin resolved emergency.
- Deep links to the relevant screen.

### 13. Settings

- Account.
- Duty preferences.
- Notification preferences.
- Location permissions.
- Help and support.

## Functional requirements

### Verification and approval

- Responder registration must create `approvalStatus: pending` and `isApproved: false` on the backend.
- Login is blocked until admin approval.
- Rejected responders see a safe rejection message and cannot access the feed.

### Emergency feed

- Emergency feed must be map first.
- Feed must be filterable by type, status, priority and distance.
- Emergencies must appear within 3 seconds of backend broadcast.
- Only emergencies within responder agency or coverage scope should be visible unless admin config allows wider viewing.

### Ambulance transport assignments

- Responder receives only ambulance transport requests assigned by admin.
- Approved request data is delivered to the selected responder app in real time.
- Request detail must include pickup and drop off coordinates.
- Responder cannot approve or reject transport requests.
- Responder cannot change assigned ambulance unit.
- Status updates must be sent through backend APIs and reflected in AdminWeb and User app.
- Live location sharing starts when the responder accepts or marks the transport as on the way.
- Live location sharing stops when the transport is completed and no emergency assignment remains.


### Navigation

- Internal route preview uses OSM compatible routing.
- External navigation opens Waze or Google Maps with victim coordinates.
- If no map app exists, show a fallback route preview.

### Status management

- Responder can mark `responder_on_the_way` only for an assigned emergency.
- Responder can submit report.
- Resolve action is not present in the responder app.
- All status updates are sent through backend APIs.

### Live tracking

- Broadcast responder GPS every 5 seconds or when movement exceeds 10 meters while on duty or assigned.
- Include accuracy, timestamp and speed where available.
- Stop location sharing when off duty and no active assignment exists.
- Use foreground service for continuous background tracking.

## API dependencies

| Need | Endpoint |
|---|---|
| Register responder | `POST /api/auth/register/responder` |
| Login | `POST /api/auth/login` |
| Current responder | `GET /api/auth/me` |
| Active emergencies | `GET /api/emergencies/active` |
| Emergency detail | `GET /api/emergencies/:id` |
| Assign or claim | `POST /api/emergencies/:id/assign` |
| Mark on the way | `POST /api/emergencies/:id/on-the-way` |
| Submit report | `POST /api/emergencies/:id/report` |
| Responder location | `POST /api/locations/responder` |
| Route | `GET /api/routes` |
| Assigned ambulance requests | `GET /api/responder/ambulance-requests/assigned` |
| Ambulance request detail | `GET /api/responder/ambulance-requests/:id` |
| Ambulance on the way | `POST /api/responder/ambulance-requests/:id/on-the-way` |
| Arrived at pickup | `POST /api/responder/ambulance-requests/:id/arrived-pickup` |
| Patient onboard | `POST /api/responder/ambulance-requests/:id/patient-onboard` |
| Complete ambulance transport | `POST /api/responder/ambulance-requests/:id/complete` |

## Real-time dependencies

Subscribe to:

```text
emergency.created
emergency.updated
emergency.assigned
emergency.resolved
ambulance_request.assigned
ambulance_request.on_the_way
ambulance_request.completed
location.user_updated
```

Emit through API, not raw socket writes:

```text
location.responder_updated
emergency.responder_on_the_way
```

## Acceptance criteria

- Responder can register with credential proof and live face capture.
- Pending responder cannot log in.
- Approved responder can log in.
- Active emergency appears on the map within 3 seconds.
- Filters update map and list immediately.
- Route preview loads within 5 seconds on normal connection.
- Waze or Google Maps intent opens with correct destination.
- Assigned ambulance transport request appears in responder app within 3 seconds.
- Responder can route to pickup and then to drop off.
- On the way status updates User app and AdminWeb in real time.
- Marking on the way updates AdminWeb and User app in real time.
- Resolve button does not appear anywhere in the responder app.
- Field report is visible in AdminWeb.
- Location sharing stops after off duty state when no active emergency exists.
- App passes `flutter analyze` and required tests.

## Phase 3 exit checklist

- [ ] Flutter project created.
- [ ] Theme tokens implemented from design reference.
- [ ] Credential based registration implemented.
- [ ] Login and approval gate implemented.
- [ ] On duty toggle implemented.
- [ ] Active emergency map implemented.
- [ ] Filters implemented.
- [ ] Emergency detail bottom sheet implemented.
- [ ] Route preview implemented.
- [ ] Ambulance assignment detail implemented.
- [ ] Pickup and drop off route workflow implemented.
- [ ] Waze and Google Maps intent implemented.
- [ ] On the way status implemented.
- [ ] Live GPS broadcast implemented.
- [ ] Response report implemented.
- [ ] Push notifications implemented.
- [ ] Proximity alert implemented.
- [ ] Tests pass.
