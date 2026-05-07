# PRD 07 - Publish Readiness and Release Checklist

**Project:** SafeAlert Emergency Response System  
**Folder:** `/SafeAlert_Workspace/quality_assurance`  
**Applies to:** Backend, User mobile, Responder mobile and Admin web  
**Status:** Implementation ready  
**Phase owner:** Release lead

## Goal

Confirm that SafeAlert is ready to publish, demo or deploy after development, security review and code logic checking. This PRD defines final release gates for backend hosting, AdminWeb deployment and Android app publishing.

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

## Release readiness scope

### Included

- Backend deployment readiness.
- AdminWeb deployment readiness.
- MobileForUser Android release readiness.
- MobileForResponder Android release readiness.
- Environment configuration.
- Security confirmation.
- QA confirmation.
- Data retention and backup plan.
- Demo script and rollback plan.

### Excluded

- iOS publishing.
- Direct integration with government dispatch systems.
- Production firmware certification.

## Backend publish readiness

Required checks:

- Production environment variables are configured.
- MongoDB Atlas IP access and credentials are correct.
- HTTPS is enabled.
- WebSocket secure transport is enabled.
- CORS production origins are set.
- Rate limits are enabled.
- Helmet is enabled.
- Logs are structured and exclude secrets.
- Admin account is seeded from environment variables.
- Database indexes are created.
- Backup policy is documented.
- Health check endpoint exists.
- Monitoring and error alerts are configured.

Backend release commands:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run start
```

## AdminWeb publish readiness

Required checks:

- Production API base URL is configured.
- WebSocket URL is configured.
- Admin login route works.
- Protected routes redirect when logged out.
- Approval Center appears before Reports.
- Ambulance Requests appears as a separate sidebar module.
- Ambulance request review shows sender information beside the form.
- Ambulance approval displays 12 unit availability.
- Live map loads OSM tiles.
- Analytics charts render.
- Reports export works if enabled.
- Responsive testing passes for desktop, tablet and mobile.
- Build artifacts do not include secrets.

AdminWeb release commands:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

## MobileForUser publish readiness

Required checks:

- App name and icon are final.
- API base URL points to production backend.
- Android permissions are justified: location, Bluetooth, camera and notifications.
- Foreground service notification copy is clear.
- ID upload and live face capture work.
- Login and Remember Me work.
- Emergency buttons work.
- Ambulance Transport form works for Emergency, Schedule and Transfer.
- Pickup and drop off booking style map selector works.
- Schedule and Transfer availability shows only 3:00 PM to 7:00 PM and respects real time availability of the 12 physical ambulance units.
- BLE pair and event handling work with real or simulated ESP32.
- OSM map and nearby facilities work.
- Responder tracking works.
- Push notifications work in foreground and background.
- Offline emergency queue works.
- Privacy and consent screens are present.

User app release commands:

```text
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```

## MobileForResponder publish readiness

Required checks:

- App name and icon are final.
- API base URL points to production backend.
- Android permissions are justified: location, notifications and file upload.
- Credential upload works.
- Login and approval gate work.
- On duty toggle works.
- Emergency map loads.
- Filters work.
- Route guidance works.
- Ambulance assignment detail works with pickup and drop off route.
- Waze or Google Maps intent works.
- On the way action works.
- Resolve control is absent.
- Field report submission works.
- Live location broadcast works only when on duty or assigned.

Responder app release commands:

```text
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```

## Design publish readiness

All production screens must match the design reference:

- Admin Navy sidebar and header system.
- Alert Red for emergency and destructive actions.
- Responder Blue for responder and route actions.
- Success Green for connected, approved and resolved states.
- Warning Amber for pending and stale states.
- Inter typography.
- Spacing scale of 4 to 48.
- Radius system of 8, 12, 16, 24 and 40.
- Approval Card includes ID proof, live face and approve or reject actions.
- IoT Device Card includes battery and connection state.
- Map includes incident pin, responder pin, route line and cluster.
- Ambulance Transport form screen includes request type selector, patient details, pickup, drop off and requested time selector.
- Ambulance Requests admin detail uses two column review layout.

## Production data readiness

- Admin account exists.
- Test user accounts are removed or marked test only.
- Test responder accounts are removed or marked test only.
- Demo emergency records are cleared or labeled demo.
- Facility data source is configured.
- Ambulance unit list from 1 to 12 is configured.
- Ambulance Schedule and Transfer physical ambulance capacity policy is configured.
- Coverage areas are configured.
- Analytics date range is verified.
- Audit log retention is configured.

## Final E2E publish scenario

Before publishing, perform this complete test on production like environment:

1. Register a user.
2. Approve the user from AdminWeb.
3. Register a responder.
4. Approve the responder from AdminWeb.
5. Submit and approve one Schedule ambulance transport request.
6. Confirm 3:00 PM to 7:00 PM operating window validation and 12 physical ambulance availability logic.
7. Assign an ambulance unit and responder.
8. Confirm responder receives pickup and drop off route.
9. Pair SafeAlert PanicButton.
10. Trigger a Fire alert through BLE.
11. Confirm emergency appears on AdminWeb live map.
12. Confirm responder receives emergency.
13. Assign responder.
14. Mark responder on the way.
15. Confirm user sees responder tracking.
16. Submit responder report.
17. Resolve in AdminWeb.
18. Confirm notifications, records, analytics and audit logs.

## Release decision matrix

| Gate | Pass condition | Release decision |
|---|---|---|
| Security | No blocker or high security issues | Required |
| Code logic | Critical E2E passes | Required |
| Backend | Build, tests and health checks pass | Required |
| AdminWeb | Build and protected routes pass | Required |
| User app | Release APK builds and critical flow works | Required |
| Responder app | Release APK builds and critical flow works | Required |
| Design | Major screens follow reference | Required |
| Documentation | Setup, deployment and rollback are documented | Required |

## Rollback plan

- Keep previous backend deployment available.
- Keep database backup before migration.
- Keep prior AdminWeb build artifact.
- Keep last stable APK for User and Responder apps.
- Document environment changes.
- Roll back if emergency creation, login or admin resolution fails in production.

## Publish acceptance criteria

- Security PRD is signed off.
- Code and Logic Checking PRD is signed off.
- Backend release build passes.
- AdminWeb release build passes.
- User app release APK builds.
- Responder app release APK builds.
- Full E2E scenario passes.
- Ambulance transport E2E scenario passes.
- No blocker or high severity bugs remain.
- Privacy and permission disclosures are present.
- Team has deployment and rollback instructions.

## Final sign off checklist

- [ ] Backend production environment verified.
- [ ] AdminWeb production environment verified.
- [ ] MobileForUser release APK verified.
- [ ] MobileForResponder release APK verified.
- [ ] Database backup verified.
- [ ] Security sign off complete.
- [ ] QA sign off complete.
- [ ] Design sign off complete.
- [ ] Ambulance transport demo script prepared.
- [ ] Demo script prepared.
- [ ] Rollback plan prepared.
- [ ] Release approved.


## Tanza and IoT release gates

- [ ] Tanza Municipality is configured as the default map extent.
- [ ] Tanza barangay list is configured for registration, analytics and filters.
- [ ] Outside Tanza GPS warning is implemented in User app and AdminWeb.
- [ ] Admin can review outside scope cases before any dispatch decision.
- [ ] IoT keychain hardware mapping is finalized as four buttons, one switch and one LED.
- [ ] Medical, Crime, Fire and General SOS buttons each send a single click BLE event.
- [ ] Mobile app displays keychain connection status and battery life.
- [ ] IoT keychain does not send personal details directly to admin.
- [ ] User mobile app attaches profile and GPS before backend submission.
- [ ] Admin OpenStreetMap marker is clickable and displays user emergency details.
- [ ] Duplicate BLE event handling is tested.
