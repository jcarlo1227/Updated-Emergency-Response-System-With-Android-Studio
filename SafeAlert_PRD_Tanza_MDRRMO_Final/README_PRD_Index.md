# SafeAlert PRD File Index

This workspace splits the SafeAlert production PRD into 9 focused PRD files. This final Tanza scoped MDRRMO version adds the ambulance transport form, 12 physical ambulance capacity policy, AdminWeb review workflow, responder assignment handoff and the corrected IoT keychain device PRD.


## MDRRMO clarification updates applied

- The 12 limit is now treated as 12 physical ambulance units, not 12 daily booking slots.
- Schedule and Transfer requests can overlap when different ambulances are available.
- Ambulance capacity is reserved only after admin approval and assignment.
- Emergency transport requests still require admin approval, but they are pinned, highlighted and prioritized.
- Proof of indigency is required.
- Tanza citizens or residents are prioritized in the admin review flow.
- A dedicated IoT keychain device PRD has been added as PRD 09.
- The app scope is limited to Tanza Municipality, Cavite.
- The IoT keychain now has 4 dedicated buttons, 1 switch and 1 LED.
- Keychain press flow is Keychain -> User Mobile App -> Backend -> Admin Dashboard -> OpenStreetMap.

## PRD files

| File | Purpose |
|---|---|
| `backend/PRD_01_Phase_1_Backend_API_Security_Layer.md` | Backend, API security, TypeScript, Zod, MongoDB models and core starter files |
| `android_studio/MobileForUser/PRD_02_Phase_2_User_Mobile_App_Flutter.md` | User Flutter app with auth, emergency flow, maps, BLE and background services |
| `android_studio/MobileForResponder/PRD_03_Phase_3_Responder_Mobile_App_Flutter.md` | Responder Flutter app with verification, feed, route, on the way status and live tracking |
| `web_admin/PRD_04_Phase_4_Admin_Command_Center_React.md` | React admin dashboard, approval center, dispatch, live map, reports and resolution |
| `quality_assurance/PRD_05_Cross_Cutting_Security_and_Privacy.md` | Security and privacy requirements across all apps |
| `quality_assurance/PRD_06_Code_and_Logic_Checking.md` | Code review, QA, logic checks and E2E scenario |
| `quality_assurance/PRD_07_Publish_Readiness_and_Release_Checklist.md` | Final publish readiness, deployment and release gates |
| `PRD_08_MDRRMO_Ambulance_Transport_Form.md` | Complete MDRRMO ambulance transport feature specification across backend, User app, Responder app and AdminWeb |
| `PRD_09_IoT_Keychain_Device_and_BLE_Integration.md` | Dedicated ESP32 BLE keychain with 4 buttons, 1 switch, 1 LED, User app handoff, backend validation, OpenStreetMap marker behavior and QA specification |

## Supporting files

| File | Purpose |
|---|---|
| `CHANGELOG_MDRRMO_Update.md` | Summary of MDRRMO clarification updates and open product decisions |

## Additional generated backend starter files

| File | Purpose |
|---|---|
| `backend/package.json` | Backend dependency and script baseline |
| `backend/tsconfig.json` | Strict TypeScript configuration |
| `backend/src/models/User.ts` | User core database model |
| `backend/src/models/Responder.ts` | Responder core database model |
| `backend/src/models/Emergency.ts` | Emergency lifecycle database model |
| `backend/src/models/LocationSample.ts` | Detailed location sample database model |
| `backend/src/models/BleDevice.ts` | ESP32 BLE device binding database model |
| `backend/src/models/AmbulanceTransportRequest.ts` | MDRRMO ambulance transport request model |
| `backend/src/models/AmbulanceUnit.ts` | Ambulance unit and availability model |
| `backend/src/models/AuditLog.ts` | Append only audit log database model |

## Required workspace structure

```text
/SafeAlert_Workspace
├── /backend
├── /web_admin
├── /android_studio
│   ├── /MobileForUser
│   └── /MobileForResponder
└── /quality_assurance
```

## Design rule

Every phase must follow `Design_Capstone.pdf` as the design reference. Use the same design tokens, components and navigation sequence, especially Approval Center before Reports in the Admin Dashboard. The updated Admin Dashboard must also include Ambulance Requests as a separate sidebar module for MDRRMO transport form review and approval.


## Final scope notes

- Production app scope is Tanza Municipality, Cavite only.
- Tanza citizens or residents are prioritized in MDRRMO review.
- Outside Tanza GPS points must be flagged and routed to manual admin decision.
- IoT keychain is BLE only for the first version.
- IoT keychain does not send personal details directly to the backend or admin.
- User mobile app attaches type of accident, full name, age, face, phone GPS, blood type and emergency contact person before backend submission.
- Admin Dashboard plots sender GPS on OpenStreetMap and shows user emergency details when the marker is clicked.
