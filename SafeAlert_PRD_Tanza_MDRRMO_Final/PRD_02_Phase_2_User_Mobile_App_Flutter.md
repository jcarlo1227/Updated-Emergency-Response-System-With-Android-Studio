# PRD 02 - Phase 2 User Mobile App Flutter

**Project:** SafeAlert Emergency Response System  
**Folder:** `/SafeAlert_Workspace/android_studio/MobileForUser`  
**Primary stack:** Flutter, Dart, Riverpod, Dio, flutter_map, flutter_blue_plus, camera  
**Status:** Implementation ready  
**Phase owner:** Flutter mobile developer

## Goal

Build the Flutter app for emergency senders. The app must allow approved users to register, log in, connect an ESP32 BLE emergency keychain, trigger emergencies, request ambulance transport, view nearby facilities and track the assigned responder or ambulance in real time.


## Municipality scope constraint

The User mobile app is scoped to Tanza Municipality, Cavite.

Rules:

- Registration must capture the user's barangay and municipality or city.
- Tanza citizens or residents receive priority in MDRRMO review.
- The emergency map, nearby facilities and ambulance location selection must default to Tanza.
- When GPS is outside Tanza, the app must warn the user that the service is outside the primary MDRRMO coverage area.
- Outside Tanza requests may be blocked or submitted as admin review only depending on final MDRRMO policy.

## Success criteria

- User can register using personal details, ID upload and live face capture.
- Login supports Remember Me persistence after admin approval.
- Pending or rejected users cannot access the emergency home.
- User can trigger Medical, Crime, Fire and General SOS from the app.
- User can submit an MDRRMO ambulance transport form with Emergency, Schedule or Transfer request type.
- Schedule and Transfer request types show only the 3:00 PM to 7:00 PM operating window and depend on real time physical ambulance availability.
- Schedule and Transfer requests may overlap when different physical ambulance units are available.
- User submission does not reserve an ambulance. A physical ambulance is reserved only after admin approval and assignment.
- Emergency ambulance request type is always prioritized and highlighted, but it still goes to admin approval.
- User can choose pickup location and drop off location through a booking style map flow.
- User can pair an ESP32 BLE emergency keychain through `flutter_blue_plus`.
- BLE events from four dedicated keychain buttons for Medical, Crime, Fire and General SOS trigger the same emergency creation flow as app buttons.
- App shows IoT keychain connected or disconnected status, last seen time and battery life.
- OpenStreetMap is displayed using `flutter_map`.
- Nearby hospitals, police stations and fire stations are visible.
- Active emergency screen shows responder on the way through Socket.io.
- Background listening works only through Android foreground service where allowed.
- App scope, maps, facility search and ambulance transport workflow are limited to Tanza Municipality, Cavite.

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
/MobileForUser
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
│   │   ├── emergency
│   │   ├── ambulance_transport
│   │   ├── map
│   │   ├── responder_tracking
│   │   ├── ble_panic_button
│   │   ├── notifications
│   │   └── settings
│   └── main.dart
├── android
├── test
└── pubspec.yaml
```

## Required Flutter packages

| Concern | Package |
|---|---|
| Routing | `go_router` |
| State management | `flutter_riverpod` |
| HTTP client | `dio` |
| Secure storage | `flutter_secure_storage` |
| BLE | `flutter_blue_plus` |
| Camera | `camera` |
| File upload | `image_picker` or document picker with restrictions |
| Maps | `flutter_map`, `latlong2` |
| Location | `geolocator` |
| Background service | `flutter_background_service` |
| Push notifications | `firebase_messaging`, `flutter_local_notifications` |
| WebSocket | `socket_io_client` |
| Connectivity | `connectivity_plus` |
| Local queue | `hive` or `isar` |
| JSON models | `freezed`, `json_serializable` |

## Screens

### 1. Splash and startup check

- Shows SafeAlert logo.
- Checks API reachability, session token, location permission, Bluetooth permission, camera permission and notification permission.
- Routes to Login, Pending Approval, Emergency Home or Active Emergency based on session and account status.

### 2. Login

- Email input.
- Password input with visibility toggle.
- Remember Me checkbox.
- Full width login button.
- Error states for invalid credentials, pending approval and rejected account.
- Uses secure token storage.

### 3. Registration step 1

- Full name.
- Date of birth.
- Computed age.
- Contact number.
- Email.
- Password and confirm password.
- Address.
- Barangay.
- Municipality or city, default and primary allowed value is Tanza.
- Consent checkbox for emergency location sharing.
- Proof of indigency upload when required by MDRRMO policy.
- Valid government ID upload if not already provided during account registration.
- Blood type field for ambulance transport records.

### 4. Registration step 2

- Proof of residency ID upload.
- Live face capture using camera only.
- Preview cards for both files.
- Submit for approval action.
- On success, route to Pending Approval.

### 5. Pending approval

- Status timeline: Submitted, Reviewing, Approved.
- Message that login becomes available after admin approval.
- Support contact.
- Logout action.

### 6. Emergency home

- Four emergency buttons only: Medical, Crime, Fire and General SOS.
- Device status card: Bluetooth, keychain connected or disconnected state, battery life, last heartbeat and last seen time.
- Nearby facilities entry point.
- Active emergency banner if one exists.
- Each app emergency button supports tap to confirm and send.
- Keychain emergency buttons use single click through BLE. No long press, double press, triple press or button sequence is required.

### 7. Emergency confirmation

- Shows selected emergency type.
- Shows current GPS status and accuracy.
- Sends only after location is available or after explicit fallback to last known location.
- Uses idempotency key.

### 8. Ambulance transport form

Entry point:

- Add an Ambulance Transport card on Emergency Home below the emergency buttons.
- The card opens a request type selector with Emergency, Schedule and Transfer.

Form fields:

- Request type: Emergency, Schedule or Transfer.
- Patient full name.
- Patient address.
- Contact number.
- Medical condition.
- Special requirements.
- Accompanying person full name and contact number.
- Pickup location selected from map with search and pin adjustment.
- Drop off location selected from map with search and pin adjustment.
- Requested date, requested time and expected transport time for Schedule and Transfer only.
- Proof of indigency is required for all ambulance transport requests.
- Tanza citizen priority fields: barangay, municipality, proof of residency when available and confirmation that the requester is a citizen or resident of Tanza.
- Transfer details for hospital to hospital transfer: origin hospital, destination hospital and referring doctor if available.

Booking style location flow:

- Pickup and drop off selection must behave like a ride hailing booking flow.
- User can search address, use current location, drag pin and confirm each location.
- Address search and map pin selection must default to Tanza Municipality.
- If pickup or drop off is outside Tanza, show an outside coverage warning and require admin review policy.
- The form must show both address labels and map pins before submission.

Schedule rules:

- Emergency request sends to the admin queue immediately and shows a critical priority notice.
- Emergency requests bypass the 3:00 PM to 7:00 PM operating window, but they still require admin approval.
- Schedule and Transfer show only 3:00 PM to 7:00 PM requested time options.
- Schedule and Transfer requests can overlap with other requests if at least one physical ambulance unit is still available.
- If all 12 physical ambulances are unavailable for the selected time range, show `No ambulance is available for this time. Please choose another time or contact MDRRMO for urgent assistance.`
- Ambulance availability is only reserved after admin approval and assignment.

Status states:

- Pending review.
- Approved.
- Rejected with reason.
- Assigned.
- Ambulance on the way.
- Arrived at pickup.
- Patient onboard.
- Completed.

### 9. Ambulance request tracking

- OpenStreetMap view.
- Pickup marker.
- Drop off marker.
- Ambulance or responder marker when assigned.
- Status timeline.
- Admin approval status.
- Assigned responder or ambulance unit when available.
- User notification when ambulance is on the way.
- Route line from ambulance to pickup and pickup to drop off when available.

### 10. Active emergency tracking

- OpenStreetMap view.
- Status timeline.
- User marker.
- Responder marker when assigned.
- Live updates from Socket.io.
- Cancel action visible only before assignment.
- Location sharing indicator.

### 11. Nearby facilities

- OpenStreetMap with hospital, police station, fire station and rescue markers.
- Facility cards show name, distance, call and directions.
- Backend provides cached facility data.

### 12. IoT Bluetooth pairing

- Shows Bluetooth status and permission state.
- Scans only for SafeAlert ESP32 BLE keychain service UUID.
- Device card shows name, ID, connected or disconnected status, battery life, signal, firmware, switch state when reported and last seen time.
- Pair, unpair, reconnect, revoke lost device and manual test actions.
- Connected device card must match the design reference with battery and connection state.
- Keychain hardware has four dedicated buttons: Medical, Crime, Fire and General SOS.
- Keychain hardware has one physical on or off switch and one LED indicator.
- Single click on a keychain button sends the emergency type to the User mobile app through BLE.
- The keychain does not send full name, age, face, blood type, emergency contact or GPS directly to admin.
- The User mobile app receives the BLE trigger, adds registered user information, captures phone GPS and sends the complete emergency request to the backend.
- App must prevent duplicate alerts from repeated BLE packets by using event IDs.
- When the keychain is disconnected, the app shows a persistent warning and last seen time.
- Direct dispatch from the keychain is not supported. The current PRD assumes the phone app provides internet, GPS and authentication.


### 13. Emergency and ambulance history

- List of user emergency records.
- List of user ambulance transport requests.
- Shows type, date, status, responder or ambulance unit if assigned and resolution notes.

### 14. Settings

- Account settings.
- Device management.
- Notification preferences.
- Privacy and location permissions.
- Help and support.


## IoT keychain emergency flow in the User app

Required flow:

```text
Keychain button single click
-> User Mobile App receives BLE event
-> App maps button to emergency type
-> App reads registered user profile
-> App captures phone GPS
-> App sends complete emergency request to backend
-> Admin Dashboard displays the alert on OpenStreetMap
```

The mobile app must attach these fields before sending the request:

- Type of accident: Medical, Crime, Fire or General SOS.
- Full name from registered profile.
- Age from date of birth.
- Face photo reference from approved registration.
- Phone GPS location with accuracy and timestamp.
- Blood type.
- Emergency contact person and contact number.
- Source set to `iot_keychain`.
- Device ID and battery level.
- Tanza scope flag.

User feedback after a keychain click:

- `Keychain alert received.`
- `Getting your GPS location.`
- `Sending emergency request to Tanza MDRRMO.`
- `Emergency sent successfully. Waiting for admin review and dispatch.`

If offline:

- Save to secure local queue.
- Show `Emergency captured but not sent. Waiting for internet connection.`
- Retry automatically until sent or until admin cancellation rules apply.


## BLE integration requirements

### GATT contract

```text
SafeAlert Service UUID: 9f4d0001-7d6a-4b85-9e74-2f4d8e8d0001
Button Event Characteristic UUID: 9f4d0002-7d6a-4b85-9e74-2f4d8e8d0002
Battery Characteristic UUID: 00002a19-0000-1000-8000-00805f9b34fb
Heartbeat Characteristic UUID: 9f4d0003-7d6a-4b85-9e74-2f4d8e8d0003
Device Config Characteristic UUID: 9f4d0004-7d6a-4b85-9e74-2f4d8e8d0004
```

### Event payload

```json
{
  "deviceId": "SA-ESP32-000001",
  "eventId": "SA-ESP32-000001-1024",
  "buttonType": "medical",
  "batteryLevel": 87,
  "firmwareVersion": "1.0.0",
  "deviceTimestamp": 1730000000000
}
```

### Rules

- Accept only `medical`, `crime`, `fire` and `general_sos`.
- Ignore unknown device IDs.
- Deduplicate by `eventId`.
- Queue emergency when offline.
- Attach registered user profile, emergency contact, blood type, face photo and accident type before API submission.
- Use current phone GPS if available.
- Use last known location only if not older than 60 seconds.
- Show disconnected state after heartbeat is missed for more than 30 seconds.
- Notify user when battery is below 20 percent.

## Background behavior

- Background location and BLE monitoring must use a foreground service on Android.
- Show persistent notification while active.
- Do not continuously track location after logout.
- Stop tracking when emergency is resolved or cancelled.
- Bluetooth monitoring can run only when the user enabled IoT keychain monitoring.

## API dependencies

| Need | Endpoint |
|---|---|
| Register user | `POST /api/auth/register/user` |
| Login | `POST /api/auth/login` |
| Refresh token | `POST /api/auth/refresh` |
| Current user | `GET /api/auth/me` |
| Create emergency | `POST /api/emergencies` |
| Create ambulance transport request | `POST /api/ambulance-requests` |
| My ambulance transport requests | `GET /api/ambulance-requests/my` |
| Ambulance request detail | `GET /api/ambulance-requests/:id` |
| Cancel ambulance request | `POST /api/ambulance-requests/:id/cancel` |
| Ambulance availability | `GET /api/ambulance-availability` |
| My emergencies | `GET /api/emergencies/my` |
| Cancel emergency | `POST /api/emergencies/:id/cancel` |
| User location | `POST /api/locations/user` |
| Pair BLE device | `POST /api/user/ble-devices/pair` |
| BLE devices | `GET /api/user/ble-devices` |
| BLE event | `POST /api/user/ble-events` |
| Create emergency from IoT | `POST /api/emergencies/from-iot` |
| Nearby facilities | `GET /api/facilities/nearby` |
| Route | `GET /api/routes` |

## Real-time dependencies

Subscribe to:

```text
emergency.updated
emergency.assigned
emergency.responder_on_the_way
emergency.responder_nearby
emergency.resolved
location.responder_updated
ambulance_request.reviewed
ambulance_request.assigned
ambulance_request.on_the_way
ambulance_request.completed
```

## Acceptance criteria

- User can complete registration with ID and live face capture.
- Pending user sees Pending Approval screen.
- Approved user can log in with Remember Me.
- Tapping Medical opens confirmation.
- Tapping Fire in the app opens confirmation. A single click on the Fire keychain button sends a BLE event to the User mobile app.
- User can submit an Emergency ambulance request without choosing a scheduled time.
- User can submit a Schedule ambulance request only within 3:00 PM to 7:00 PM.
- User can submit overlapping Schedule or Transfer requests only when backend availability confirms that at least one physical ambulance unit is available.
- User receives reviewed, assigned and on the way notifications for ambulance transport.
- BLE Medical button creates a Medical emergency.
- Duplicate BLE event creates only one emergency.
- Offline BLE event is queued and sent when online.
- Active emergency appears on AdminWeb and responder app within 3 seconds after backend accepts it.
- Responder on the way status appears without manual refresh.
- Battery and connection status display accurately.
- Background service notification appears when BLE or active emergency tracking is running.
- App passes `flutter analyze` and required tests.

## Phase 2 exit checklist

- [ ] Flutter project created.
- [ ] Theme tokens implemented from design reference.
- [ ] Registration with ID and face capture implemented.
- [ ] Login with Remember Me implemented.
- [ ] Approval gate implemented.
- [ ] Emergency home implemented.
- [ ] Emergency confirmation implemented.
- [ ] Ambulance transport form implemented.
- [ ] Ambulance availability and requested time selection implemented.
- [ ] Ambulance request tracking implemented.
- [ ] Active emergency tracking implemented.
- [ ] OSM map implemented.
- [ ] Nearby facilities implemented.
- [ ] BLE scan, pair and event handling implemented.
- [ ] Battery and connection state implemented.
- [ ] Background service implemented.
- [ ] Socket.io tracking implemented.
- [ ] Push notification deep links implemented.
- [ ] Offline emergency queue implemented.
- [ ] Tests pass.
