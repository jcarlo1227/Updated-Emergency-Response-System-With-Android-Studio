# PRD 06 - Code and Logic Checking PRD

**Project:** SafeAlert Emergency Response System  
**Folder:** `/SafeAlert_Workspace/quality_assurance`  
**Applies to:** Backend, User mobile, Responder mobile and Admin web  
**Status:** Implementation ready  
**Phase owner:** QA lead, tech lead or code reviewer

## Goal

Define the review process that confirms the SafeAlert codebase is logically correct, type safe, maintainable and aligned with the emergency lifecycle before it moves to publish readiness.

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

## Review principles

- Prioritize emergency flow and ambulance transport correctness over cosmetic details.
- No raw JSON reaches controllers without validation.
- No production TypeScript `any`.
- No UI action bypasses backend authorization.
- No role can access actions outside its responsibility.
- Code should be modular, readable and testable.
- Every feature has loading, empty, error and success states.

## Backend code checks

### Type and lint gates

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Required pass conditions:

- TypeScript strict mode passes.
- No `any` in production source.
- No unused route handlers.
- No unhandled promise routes.
- No controller reads raw `req.body` directly.
- No hardcoded secrets.

### Logic checks

| Area | Check |
|---|---|
| Auth | Pending and rejected accounts are blocked |
| Approval | Approve and reject update status, boolean approval and audit log |
| Emergency creation | Validates location, type, source and idempotency key |
| Ambulance request creation | Validates request type, patient data, pickup, drop off, schedule window and physical ambulance capacity ruleacity |
| Ambulance availability | Schedule and Transfer allow only 3:00 PM to 7:00 PM and check real time availability of 12 physical ambulance units |
| Ambulance emergency priority | Emergency request type bypasses the Schedule and Transfer operating window, stays highest priority and remains admin approved and audited |
| Duplicate control | Same idempotency key creates only one emergency |
| Status transition | Invalid transition returns conflict |
| Responder permissions | Responder cannot resolve emergency |
| Admin resolution | Requires responder report or override reason |
| Location updates | Max 100 location history points are retained |
| Audit log | Approval, rejection, dispatch, document view and resolve are recorded |

## User mobile code checks

```text
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
```

Required logic checks:

- Registration validates required fields.
- Live face capture cannot use gallery import.
- ID upload supports only approved formats.
- Pending approval screen blocks emergency home.
- Emergency buttons confirm before sending unless hold to send is completed.
- Ambulance transport form supports Emergency, Schedule and Transfer.
- Pickup and drop off location selector confirms both pins before submission.
- Schedule and Transfer cannot submit outside 3:00 PM to 7:00 PM.
- No ambulance available state appears when all 12 physical units are unavailable for the requested time range.
- BLE events are deduplicated.
- Unknown BLE device events are ignored.
- Offline emergency queue retries safely.
- Active emergency tracking stops after resolution.
- Socket update changes UI without manual refresh.

## Responder mobile code checks

```text
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
```

Required logic checks:

- Credential upload is required for registration.
- Pending approval screen blocks duty map.
- Emergency filters work by type, status, priority and distance.
- Assigned ambulance transport request appears only for assigned responder.
- Ambulance route goes to pickup first, then drop off.
- On the way status for ambulance transport updates user and admin screens.
- On the way action requires assigned emergency.
- Resolve control is absent.
- Location sharing starts on duty or active assignment.
- Location sharing stops off duty when no assignment exists.
- Report submission is required before normal admin resolution.

## Admin web code checks

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Required logic checks:

- Admin routes are protected.
- Approval Center exists before Reports in sidebar order.
- Document previews use protected URLs.
- Reject requires reason.
- Dispatch list shows role and field for available responders.
- Ambulance Requests exists as separate sidebar module.
- Ambulance request detail shows sender profile beside transport form.
- Admin approval shows 12 ambulance capacity and prevents overbooking for Schedule and Transfer.
- Approved ambulance requests move out of pending table and update analytics.
- Resolve action is admin only.
- Analytics updates after resolution.
- Audit log table includes approval, rejection, dispatch and resolve actions.

## End to end critical scenario

The system must pass this flow without manual database edits:

1. User registers with ID and live face.
2. Admin approves user.
3. Responder registers with credential.
4. Admin approves responder.
5. User pairs ESP32 device.
6. User presses Fire on the ESP32 device.
7. User app sends emergency with GPS.
8. AdminWeb and responder app receive emergency.
9. Admin or responder assigns responder based on configured rule.
10. Responder marks on the way.
11. User app shows responder marker.
12. Responder submits field report.
13. Admin resolves emergency.
14. User and responder receive resolved notification.
15. Analytics and records update.

## End to end ambulance transport scenario

The system must pass this flow without manual database edits:

1. Approved user opens Ambulance Transport from the User app.
2. User selects Schedule request type.
3. User selects pickup and drop off locations through the booking style map flow.
4. User selects a time between 3:00 PM and 7:00 PM.
5. Backend confirms at least one physical ambulance unit is available for the requested time range after admin approval.
6. AdminWeb receives the pending ambulance request.
7. Admin opens the request and sees sender registered information beside the form.
8. Admin approves the request.
9. Admin selects an available ambulance unit from 1 to 12 and assigns a responder.
10. Assigned responder app receives the approved form and route.
11. Responder marks on the way.
12. User app receives the on the way notification and tracking view.
13. Responder follows pickup route, marks patient onboard and completes drop off.
14. Admin analytics updates request count, ambulance utilization and dispatch time.

## Review artifact requirements

Each code review must produce:

- Reviewer name.
- Date.
- App or module reviewed.
- Checklist status.
- Bugs found.
- Severity.
- Fix owner.
- Retest result.
- Final sign off.

## Severity definitions

| Severity | Meaning | Release impact |
|---|---|---|
| Blocker | Emergency flow, auth or data safety is broken | Cannot release |
| High | Major role, location, BLE or resolve logic issue | Cannot release until fixed |
| Medium | Feature works but has reliability or UX issue | Fix before final publish if time allows |
| Low | Cosmetic, copy or minor spacing issue | Can release with approval |

## Code and logic acceptance criteria

- Backend test suite passes.
- User app tests pass.
- Responder app tests pass.
- Admin web tests pass.
- Critical E2E scenario passes.
- Ambulance transport E2E scenario passes.
- No blocker or high severity bugs remain open.
- Design reference checklist is passed for every visible screen.
- All routes and UI actions respect role boundaries.

## Sign off checklist

- [ ] Backend typecheck passed.
- [ ] Backend tests passed.
- [ ] User app analyze passed.
- [ ] User app tests passed.
- [ ] Responder app analyze passed.
- [ ] Responder app tests passed.
- [ ] Admin web typecheck passed.
- [ ] Admin web tests passed.
- [ ] E2E emergency scenario passed.
- [ ] E2E ambulance transport scenario passed.
- [ ] No blocker issues remain.
- [ ] No high issues remain.
- [ ] Design compliance reviewed.
- [ ] Security PRD checks linked.


## Additional Tanza and IoT test scenarios

### Tanza Municipality scope

- Register user with Tanza barangay and confirm priority flag is created.
- Submit emergency with GPS inside Tanza and confirm it is dispatch eligible.
- Submit emergency with GPS outside Tanza and confirm `outside_tanza_scope` warning appears in User app and AdminWeb.
- Confirm OpenStreetMap default viewport loads Tanza Municipality.
- Confirm analytics separate inside Tanza records from outside scope records.

### Four button IoT keychain

- Pair keychain to approved user.
- Confirm mobile app displays connected status and battery life.
- Turn hardware switch off and confirm disconnected or inactive state appears.
- Press Medical button once and confirm emergency type is `medical`.
- Press Crime button once and confirm emergency type is `crime`.
- Press Fire button once and confirm emergency type is `fire`.
- Press General SOS button once and confirm emergency type is `general_sos`.
- Confirm no long press, double press, triple press or sequence logic is required.
- Confirm keychain payload does not include full name, age, face, blood type, emergency contact or GPS.
- Confirm User mobile app attaches type of accident, full name, age, face, phone GPS, blood type and emergency contact before sending to backend.
- Confirm AdminWeb OpenStreetMap marker appears at sender GPS location.
- Click marker and confirm user information is displayed.
- Confirm duplicate BLE event ID creates only one emergency record.
