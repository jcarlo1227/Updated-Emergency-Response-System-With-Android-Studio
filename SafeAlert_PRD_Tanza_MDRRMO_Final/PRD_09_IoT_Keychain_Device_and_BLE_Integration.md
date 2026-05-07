# PRD 09 - IoT Keychain Device and BLE Integration

**Project:** SafeAlert Emergency Response System for Tanza Municipality  
**Applies to:** ESP32 BLE keychain device, User mobile app, Backend API, Admin Command Center, Responder mobile app  
**Primary stakeholders:** Citizens of Tanza, MDRRMO admins, responders, IoT developer, Flutter developer and backend developer  
**Status:** Updated based on final IoT discussion  
**Phase owner:** IoT developer with Flutter and backend leads

## Goal

Define the correct IoT keychain workflow for SafeAlert. The keychain is a Bluetooth emergency trigger device. It does not directly send emergency details to the backend or admin dashboard. A button press is received by the paired User mobile app, then the mobile app attaches the registered user profile and phone GPS location before sending the emergency request to the backend.

## Municipality scope constraint

The IoT keychain feature is scoped to Tanza Municipality, Cavite.

Rules:

- The mobile app must send the emergency to Tanza MDRRMO.
- The admin map must default to Tanza Municipality.
- GPS outside Tanza must be flagged as `outside_tanza_scope`.
- Outside scope alerts must not be auto-dispatched without admin review or MDRRMO override.
- The keychain must be paired only to an approved registered user.

## Product clarification

The current hardware scope is BLE only. The keychain has no direct internet connection, no GSM or LTE, no SIM module and no onboard GPS in this version. The phone supplies authentication, registered user details, internet and GPS.

Correct flow:

```text
Keychain Button Press
-> User Mobile App receives BLE signal
-> User Mobile App identifies accident type
-> User Mobile App attaches registered user information and phone GPS
-> Backend receives complete emergency request
-> Admin Dashboard receives alert
-> OpenStreetMap shows sender GPS icon
-> Admin clicks icon to view user information
```

## Hardware specification

Required hardware:

- ESP32 BLE capable board.
- Four dedicated emergency buttons.
- One physical on or off switch.
- One LED indicator for device state.
- Battery.
- Charging port.
- Unique device ID.
- Firmware version.
- Battery level reporting when supported.

Four button mapping:

| Button | Emergency type | Use case |
|---|---|---|
| Crime | `crime` | Crime incident, safety threat, violence, robbery or security concern |
| Fire | `fire` | Fire incident, smoke, explosion risk or fire hazard |
| Medic | `medical` | Medical emergency, injury, health emergency or ambulance related incident |
| General SOS | `general_sos` | Road accident, typhoon, earthquake, flood, collapse, hazard or other emergency |

Switch behavior:

| Switch state | Meaning | Expected behavior |
|---|---|---|
| ON | Keychain active | Device advertises or reconnects to paired phone through BLE |
| OFF | Keychain inactive | Device does not trigger emergency events |

LED behavior:

| LED state | Meaning |
|---|---|
| Off | Device is switched off |
| Slow blink | Device is on but not connected |
| Solid light | Connected to User mobile app |
| Fast blink for 3 seconds | Button press was detected and event was sent to app |
| Repeating quick blink | Battery is low |

## Explicitly removed behavior

The following are not part of the PRD anymore:

- Long press emergency sequence.
- Double press, triple press or multi press mapping.
- Press and hold to select emergency type.
- Keychain direct to backend transmission.
- Keychain direct to Admin Dashboard transmission.
- Keychain stored personal profile data.
- Keychain onboard GPS for the first version.

Each button uses a single click only.

## Target users

- Approved registered citizens or residents within Tanza Municipality.
- Elderly users, commuters, students and people who need fast emergency access.
- MDRRMO admins who need verified, location based emergency alerts.
- Responders who need emergency type, sender profile and map location.

## Success criteria

- User can pair one SafeAlert keychain to one approved account.
- User app shows keychain status as Connected, Disconnected, Inactive, Low Battery or Revoked.
- User app shows keychain battery life.
- Four hardware buttons create the correct emergency type through single click.
- User mobile app attaches type of accident, full name, age, face, phone GPS, blood type and emergency contact person before backend submission.
- Backend stores the emergency with `source: iot_keychain`.
- Admin Dashboard shows the emergency on OpenStreetMap at the sender phone GPS location.
- Admin can click the map icon and view the sender emergency details.
- Duplicate BLE packets do not create duplicate emergency records.
- Outside Tanza GPS locations are flagged for admin review.

## Pairing flow

1. User logs in with an approved account.
2. User opens Settings, then IoT Keychain.
3. User taps Pair Device.
4. App scans only for the SafeAlert BLE service UUID.
5. User selects the visible keychain device.
6. App reads device ID, firmware version, battery level and switch state when available.
7. Backend checks if the device is unpaired or already belongs to the same user.
8. Backend creates or updates the `BleDevice` binding.
9. App shows the keychain card.
10. User can run a test event that does not send a real emergency.

## User Mobile App keychain screen

Display:

- Device name.
- Device ID.
- Connection status: Connected, Disconnected, Inactive, Low Battery or Revoked.
- Battery percentage.
- Signal strength.
- Firmware version.
- Last seen time.
- Assigned user.
- Four button labels: Crime, Fire, Medic and General SOS.
- Pair button.
- Unpair button.
- Reconnect button.
- Test button.
- Revoke lost device action.

Sample card:

```text
SafeAlert Keychain
Status: Connected
Battery: 82 percent
Last Seen: 10:42 AM
Assigned User: Juan Dela Cruz
```

## BLE service specification

Recommended GATT design:

```text
Service: SafeAlert Emergency Keychain Service
Characteristic: device_id, read only
Characteristic: firmware_version, read only
Characteristic: battery_level, read and notify
Characteristic: button_event, notify
Characteristic: device_status, notify
Characteristic: acknowledgement, write
```

### Button event payload from keychain to app

The keychain sends only trigger data:

```json
{
  "deviceId": "SAFE-KEY-000001",
  "eventId": "SAFE-KEY-000001-0001024",
  "buttonType": "medical",
  "batteryLevel": 82,
  "firmwareVersion": "1.0.0",
  "deviceTimestamp": 1730000000000
}
```

Allowed `buttonType` values:

```text
crime
fire
medical
general_sos
```

## Emergency request created by User Mobile App

After receiving the BLE event, the User mobile app creates the full emergency payload.

```json
{
  "source": "iot_keychain",
  "typeOfAccident": "medical",
  "fullName": "Juan Dela Cruz",
  "age": 34,
  "facePhotoFileId": "file_profile_face_123",
  "bloodType": "O+",
  "emergencyContactPerson": "Maria Dela Cruz",
  "emergencyContactNumber": "09171234567",
  "location": {
    "latitude": 14.3949,
    "longitude": 120.8533,
    "accuracyMeters": 12,
    "capturedAt": "2026-05-06T12:00:00.000Z"
  },
  "municipality": "Tanza",
  "barangay": "Daang Amaya",
  "isInsideTanza": true,
  "deviceId": "SAFE-KEY-000001",
  "eventId": "SAFE-KEY-000001-0001024",
  "deviceBatteryAtTrigger": 82
}
```

The mobile app must not depend on the keychain for user profile data. The app reads the approved registered user profile from secure storage or through the backend session.

## User feedback after keychain click

The User mobile app should show these states:

```text
Keychain alert received.
Getting your GPS location.
Sending emergency request to Tanza MDRRMO.
Emergency sent successfully. Waiting for admin review and dispatch.
```

If the phone has no internet:

```text
Emergency captured but not sent. Waiting for internet connection.
```

Offline rule:

- Store the emergency event in a secure local queue.
- Retry automatically when the phone reconnects.
- Keep the original event ID for idempotency.
- Show clear warning that MDRRMO has not received the alert yet.

## Backend requirements

### BleDevice model

Required fields:

- Device ID.
- Owner user ID.
- Pairing status.
- Firmware version.
- BLE service UUID.
- Battery percentage.
- Last RSSI.
- Last seen time.
- Last known connection status.
- Revoked status.
- Revoked reason.
- Created at.
- Updated at.

### Emergency model additions

- `source: mobile_app | iot_keychain | admin_created`.
- `typeOfAccident: medical | crime | fire | general_sos`.
- `sourceDeviceId` when source is IoT keychain.
- `eventId` for duplicate prevention.
- `deviceBatteryAtTrigger`.
- `isInsideTanza`.
- `outsideTanzaScopeReason` when applicable.
- Snapshot fields from registered user profile: full name, age, face photo, blood type and emergency contact.

### API endpoints

```text
GET  /api/user/ble-devices
POST /api/user/ble-devices/pair
POST /api/user/ble-devices/unpair
POST /api/user/ble-devices/revoke
POST /api/user/ble-events
POST /api/emergencies/from-iot
GET  /api/admin/iot-devices
GET  /api/admin/iot-devices/:id
GET  /api/admin/emergencies/:id
```

### Backend validation rules

- Only approved users can pair a keychain.
- One active keychain can be paired to one user unless admin enables multiple devices.
- Revoked devices cannot trigger emergencies.
- Backend must reject emergency events from unknown devices.
- Backend must reject duplicate `deviceId + eventId` events.
- Backend must validate that the keychain belongs to the authenticated user.
- Backend must flag GPS outside Tanza Municipality.
- Pairing, revocation, emergency creation and admin viewing must create audit logs.

## Admin Dashboard requirements

### Emergency queue

IoT keychain alerts must appear in the emergency queue as critical alerts.

Display:

- `CRITICAL: IoT Keychain Alert` badge.
- Type of accident.
- Sender full name.
- Barangay.
- Tanza scope status.
- Source device ID.
- Battery at trigger.
- Submitted timestamp.
- Status: Pending Admin Review, Assigned, On the Way, Resolved or Cancelled.

### OpenStreetMap behavior

The Admin Dashboard must display the sender GPS on OpenStreetMap.

Map requirements:

- Default map center is Tanza Municipality.
- A marker appears at the sender phone GPS location.
- Marker icon changes by accident type.
- IoT keychain marker has a visible source badge.
- Marker pulses or highlights while pending admin review.
- Marker can be clicked.

Marker click drawer must show:

- Type of accident.
- Full name.
- Age.
- Face photo.
- Location and GPS accuracy.
- Blood type.
- Emergency contact person.
- Emergency contact number.
- Barangay and municipality.
- Source: IoT Keychain.
- Device ID.
- Device battery at trigger.
- Tanza scope status.
- Action buttons: Review, Dispatch, Call contact, View audit trail.

## Responder app requirements

Responder must see the same emergency information after admin assignment:

- Type of accident.
- Full name.
- Age.
- Face photo when allowed.
- Phone number when allowed.
- Blood type.
- Emergency contact person and number.
- GPS location and accuracy.
- Source: IoT Keychain.
- Device battery at trigger.
- Tanza scope status.
- Route to sender location.

Responder must not see proof of indigency or valid ID unless MDRRMO requires it for the active case.

## Security and privacy rules

- The keychain must not store full name, age, face photo, blood type, emergency contact, proof of indigency or valid ID.
- BLE payload must contain only event and device data.
- The User mobile app must authenticate the user before sending the complete emergency request.
- The backend must verify device ownership.
- Admin and responder access to user emergency details must be role based.
- Every emergency detail view must be audit logged.
- Stolen or lost devices must be revocable.

## QA test scenarios

- Pair new keychain to approved user.
- Reject pairing for pending user.
- Reject pairing for device already owned by another user.
- Confirm app displays connected status and battery life.
- Press Crime once and confirm `crime` emergency.
- Press Fire once and confirm `fire` emergency.
- Press Medic once and confirm `medical` emergency.
- Press General SOS once and confirm `general_sos` emergency.
- Confirm no long press or sequence is required.
- Confirm keychain payload excludes personal details and GPS.
- Confirm User mobile app attaches profile and GPS.
- Confirm backend stores `source: iot_keychain`.
- Confirm duplicate event ID creates only one emergency.
- Confirm AdminWeb displays a marker on OpenStreetMap at the sender GPS location.
- Click marker and confirm user information drawer displays correctly.
- Confirm location outside Tanza shows outside scope warning.
- Confirm responder receives assigned IoT keychain emergency with correct map route.
- Revoke lost keychain and confirm backend rejects future events.

## Remaining product decisions

1. Should one user be allowed to pair more than one keychain for family or caretaker use?
2. Should the app include a silent visual mode for crime related emergencies?
3. Should the mobile app allow a short cancel window before sending, or should all keychain clicks send immediately?
4. Should outside Tanza alerts be blocked at submission or submitted with admin review only?
