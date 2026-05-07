# PRD 05 - Cross Cutting Security and Privacy Hardening

**Project:** SafeAlert Emergency Response System  
**Folder:** `/SafeAlert_Workspace/quality_assurance`  
**Applies to:** Backend, User mobile, Responder mobile and Admin web  
**Status:** Implementation ready  
**Phase owner:** Security lead or senior developer

## Goal

Create one security PRD that governs all apps and services. This PRD must be used before building production features and before approving any release candidate.

## Municipality scope and privacy boundary

SafeAlert production scope is Tanza Municipality, Cavite. The system must minimize data outside this coverage area and must clearly flag outside scope GPS records. User profile, proof of indigency, valid ID, face photo, blood type and emergency contact data must only be displayed to authorized MDRRMO admins or assigned responders when needed for active emergency response.

IoT keychain alerts must follow the same privacy rules as app alerts. The keychain stores only device data and does not store the user's full name, age, face, blood type, emergency contact or GPS history.


## Security objectives

- Protect emergency users, ambulance transport patients, responders and admins.
- Prevent brute force, injection, broken access control and secret leakage.
- Ensure proof of indigency, valid IDs, identity documents and live face captures are not exposed publicly.
- Enforce typed, validated and auditable backend operations.
- Prevent direct MongoDB Atlas access from mobile and web clients.
- Ensure tracking is explicit, limited and stopped when no longer needed.
- Ensure ambulance transport pickup and drop off locations are accessed only by the requester, assigned responder and authorized admins.
- Treat proof of indigency, Tanza residency evidence, valid ID, face capture and blood type as sensitive records with strict access controls.

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

## Backend security requirements

### Secrets

- No real `.env` files committed.
- No fallback `JWT_SECRET`.
- `JWT_SECRET` must be at least 32 bytes if HS256 is used.
- MongoDB URI must be backend only.
- Admin seed username and password must come from environment variables.
- Seeded admin password must be hashed before storage.

### Request security

- `helmet` enabled.
- `x-powered-by` disabled.
- CORS whitelist is environment based.
- Production CORS must not use wildcard.
- JSON body size limit is enforced.
- `express-mongo-sanitize` enabled.
- Route level `express-rate-limit` enabled.
- Zod validates every body, query and params object.

### Auth and authorization

- User can access only own profile, devices and emergency history.
- Responder can access only allowed emergencies.
- Admin can access approvals, resolution, analytics and audit logs.
- Non-admin cannot resolve emergency.
- Pending and rejected accounts cannot log in.
- Refresh tokens are stored hashed and can be revoked.

### File safety

- Identity documents, credentials and face captures are never public URLs.
- File access requires signed URL or authenticated protected route.
- Validate extension, MIME type, magic bytes and size.
- Admin document views are audit logged.
- Ambulance transport form views by admin are audit logged.
- Logs must never contain passwords, tokens, full ID images, proof of indigency images, blood type values or full medical condition text.

## Mobile security requirements

### User app

- Tokens stored in `flutter_secure_storage`.
- No access token in logs.
- BLE events accepted only from paired device IDs.
- Emergency queue avoids storing excessive PII.
- Ambulance transport offline cache stores only minimum request draft data and must encrypt local storage where supported.
- Location tracking indicator is visible during active emergency.
- Background BLE monitoring uses a persistent notification.

### Responder app

- Tokens stored in `flutter_secure_storage`.
- Responder location broadcasts only when on duty or assigned.
- Off duty state stops continuous tracking.
- Responder cannot see resolve controls.
- Sensitive emergency data is shown only after authorization.

## Admin web security requirements

- No admin credentials hardcoded in frontend.
- Protected routes validate admin role.
- Idle timeout and token refresh behavior are defined.
- Approval actions require confirmation.
- Rejection requires reason.
- Ambulance transport approval, rejection, availability override and assignment require audit logging.
- Resolve requires report or override reason.
- Document viewer must not expose public file links.

## Privacy requirements

- Collect only data required for approval, emergency response and ambulance transport.
- Show consent before location sharing.
- Show active tracking indicator.
- Retain detailed location samples only within policy.
- Resolved emergency and completed ambulance transport records retain required summary data only.
- Admin document viewing is recorded.
- Audit logs are append only.

## Threat checklist

| Threat | Required control |
|---|---|
| Brute force login | Login rate limit and generic error message |
| NoSQL injection | Zod validation and mongo sanitize |
| Broken access control | JWT, role guard and ownership checks |
| Token theft | Secure storage, short access token and hashed refresh token |
| File exposure | Auth protected file route or signed URL |
| Duplicate emergency spam | Idempotency key and active emergency guard |
| Ambulance capacity abuse | Server side 3:00 PM to 7:00 PM validation, physical ambulance availability checks and audit log |
| False emergency priority abuse | Emergency priority requires explicit request type, admin approval, audit trail and critical queue visibility |
| Location bloat | Separate samples and max 100 response history |
| Unauthorized BLE trigger | Pairing, device binding and event deduplication |
| Admin misuse | Audit logs and confirmation steps |

## Security acceptance criteria

- Secret scan returns no committed secrets.
- Production backend fails startup when required secrets are missing.
- Sixth failed login attempt in window returns HTTP 429.
- Malicious JSON with `$ne` cannot bypass login.
- User A cannot fetch User B emergency history.
- Responder cannot resolve emergency by API or UI.
- User cannot create Schedule or Transfer outside 3:00 PM to 7:00 PM.
- User cannot reserve any ambulance while the request is pending review. Reservation happens only after admin approval and assignment.
- Non assigned responder cannot access ambulance transport form details.
- Non-admin cannot access approval files.
- Admin document view creates audit log.
- Logs do not contain passwords, tokens or raw ID images.
- Mobile background tracking stops after emergency or duty state ends.

## Security sign off checklist

- [ ] Environment validation reviewed.
- [ ] Rate limits tested.
- [ ] Zod schemas reviewed.
- [ ] Auth and role guards tested.
- [ ] File upload validation tested.
- [ ] CORS tested.
- [ ] Secret scan passed.
- [ ] Dependency audit reviewed.
- [ ] BLE pairing authorization tested.
- [ ] Admin audit log tested.
- [ ] Ambulance transport privacy and audit rules tested.
- [ ] Schedule and Transfer operating window and ambulance availability validation tested.
- [ ] Privacy screens reviewed.
- [ ] Release candidate approved for QA.

## IoT keychain privacy rule

- The IoT keychain sends only device ID, selected button type, event ID, battery level, firmware version and device timestamp.
- The User mobile app attaches the emergency profile and GPS data after validating the paired device.
- AdminWeb and assigned responders may view type of accident, full name, age, face, location, blood type and emergency contact person only for active or authorized records.
- BLE event payload must never include proof of indigency, valid ID image or face image.
- All IoT emergency access must be audit logged.
