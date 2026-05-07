# PRD 08 - MDRRMO Ambulance Transport Form

**Project:** SafeAlert Emergency Response System  
**Applies to:** Backend, User mobile app, Responder mobile app and Admin Command Center  
**Primary stakeholders:** MDRRMO, Admin dispatch team, ambulance responders and registered users  
**Status:** Updated after MDRRMO clarification  
**Phase owner:** Product owner with backend, Flutter and AdminWeb leads

## Goal

Add a complete MDRRMO ambulance transport workflow to SafeAlert. Registered users must be able to request ambulance transport from the mobile app. Admin must review and approve or reject every form. After approval, Admin must assign one available physical ambulance unit and responder. The selected responder receives the transport form with pickup and drop off locations and uses the fastest route.

## Confirmed MDRRMO decisions

- Ambulance transport request types are Emergency, Schedule and Transfer.
- Emergency means immediate ambulance need.
- Schedule means planned ambulance transport.
- Transfer means hospital to hospital transfer.
- Schedule and Transfer are allowed only from 3:00 PM to 7:00 PM.
- The capacity limit means 12 physical ambulance units, not 12 booking slots per day.
- Schedule and Transfer requests may overlap when different physical ambulance units are available.
- A physical ambulance unit is reserved only after admin approval and assignment.
- Emergency requests remain subject to admin approval, but must be critical priority and visually stand out from the rest.
- Proof of indigency is required.
- Citizens or residents of Tanza are prioritized and the production scope is limited to Tanza Municipality.

## Municipality scope

The ambulance transport feature is scoped to Tanza Municipality, Cavite. Pickup and drop off search should default to Tanza. Requests outside Tanza must show a warning and require admin decision. Analytics must separate Tanza requests from outside scope records.

## Request types

| Type | Meaning | Time rule | Capacity rule | Admin priority |
|---|---|---|---|---|
| Emergency | Immediate ambulance need | Allowed anytime | Uses physical ambulance availability once assigned | Critical, pinned to top |
| Schedule | Planned ambulance transport | 3:00 PM to 7:00 PM only | Can overlap if a different physical unit is available | Normal |
| Transfer | Hospital to hospital transfer | 3:00 PM to 7:00 PM only | Can overlap if a different physical unit is available | High or normal based on patient condition |

## Physical ambulance capacity rule

- The system manages 12 physical ambulance units.
- Each unit has a status: Available, Assigned, On the way, At pickup, Patient onboard, Completed, Maintenance or Out of service.
- Schedule and Transfer requests do not consume capacity while pending review.
- Capacity is reserved only after admin approval and assignment of a specific ambulance unit.
- Multiple Schedule or Transfer requests may use the same requested time only when different ambulance units are available.
- If all 12 physical ambulances are assigned, in maintenance or out of service for the requested time range, the user and admin must see a no availability state.
- Emergency requests bypass the 3:00 PM to 7:00 PM window, but they do not bypass the physical reality of ambulance availability. When all units are busy, AdminWeb must show a critical shortage warning.

## Tanza citizen priority rule

- Proof of indigency is required for all ambulance transport requests.
- The form must capture barangay, municipality or city and Tanza citizen or resident confirmation.
- Tanza citizens or residents receive priority in admin review and scheduling.
- SafeAlert app scope is Tanza Municipality. Non Tanza or outside scope requests must be flagged for manual admin decision and must not be auto-dispatched unless MDRRMO policy allows an override or inter-agency coordination.
- Admin must see a clear `Tanza Priority` badge beside the sender profile.

## User mobile requirements

### Entry point

- Add an Ambulance Transport card on the Emergency Home screen.
- Card copy: `Request ambulance transport`.
- Opening the card shows a request type selector: Emergency, Schedule and Transfer.

### Form fields

#### Registered sender information pulled from account profile

- Full name.
- Proof of indigency file.
- Valid ID file.
- Age.
- Date of birth.
- Blood type.
- Face capture.
- Barangay.
- Municipality or city.
- Tanza citizen or resident priority flag.

#### Transport form fields entered by user

- Request type.
- Patient full name.
- Patient address.
- Contact number.
- Medical condition.
- Special requirements.
- Accompanying person full name.
- Accompanying person contact number.
- Pickup location.
- Drop off location.
- Requested date and time for Schedule and Transfer.
- Expected transport duration if known.
- Origin hospital, destination hospital and referring doctor for Transfer.

### Pickup and drop off booking flow

- Pickup and drop off location selection must behave like a ride hailing booking app.
- User can search for an address.
- User can use current location.
- User can drag a map pin.
- User must confirm pickup first, then drop off.
- Both locations must show address labels, coordinates and map pins before submission.

### User availability messages

- For Schedule and Transfer outside 3:00 PM to 7:00 PM: `Schedule and Transfer ambulance transport is available from 3:00 PM to 7:00 PM only.`
- For no ambulance available: `No ambulance is available for this time. Please choose another time or contact MDRRMO for urgent assistance.`
- For Emergency: `Emergency ambulance requests are prioritized and will be reviewed by admin immediately.`
- After submission: `Your request is pending MDRRMO review.`
- After approval and assignment: `Ambulance is on the way.`

## AdminWeb requirements

### Navigation

Add a dedicated sidebar item:

```text
Ambulance Requests
```

Recommended order:

1. Dashboard
2. Live Map
3. Emergencies
4. Responders
5. Users
6. Approval Center
7. Ambulance Requests
8. Reports
9. Audit Logs
10. Settings

### Pending approval table

Columns:

- Priority badge.
- Request type.
- Sender full name.
- Tanza priority.
- Patient name.
- Pickup location.
- Drop off location.
- Requested date and time.
- Submitted time.
- Status.
- Action.

Sorting rules:

1. Emergency requests first.
2. Requests from Tanza citizens or residents second.
3. Transfer requests with high medical risk third.
4. Oldest pending request next.

### Request detail view

Use a two column layout.

Left column shows sender profile:

- Full name.
- Proof of indigency preview.
- Valid ID preview.
- Age.
- Date of birth.
- Blood type.
- Face capture.
- Barangay.
- Municipality or city.
- Tanza priority badge.

Right column shows ambulance transport form:

- Request type.
- Patient information.
- Medical condition.
- Special requirements.
- Accompanying person.
- Pickup location map.
- Drop off location map.
- Requested date and time.
- Transfer details when applicable.

### Approval actions

- Approve.
- Reject.
- Request more information.
- Mark as critical review.

Rejection must require a reason.

### Assignment workflow

- After admin clicks Approve, AdminWeb must show the 12 physical ambulance units.
- Available units can be selected.
- Assigned, maintenance and out of service units must be disabled.
- If the requested time range overlaps with an existing assignment for a unit, that unit must be disabled.
- Admin selects ambulance unit, responder or driver and confirms assignment.
- The approved request leaves the pending approval table and moves to active transport, records and analytics.
- The selected responder mobile app receives the request immediately.

### Emergency visual priority

Emergency transport requests must be visually different:

- Red critical badge.
- Pinned to top of the table.
- Alert sound or notification for admins.
- Critical row background.
- `Immediate ambulance required` label.
- Cannot be hidden by default filters.

## Responder mobile requirements

- Responder receives approved and assigned ambulance transport request.
- Responder sees patient name, request type, pickup location, drop off location, special requirements and contact number.
- Responder can open fastest route to pickup.
- Responder can open route from pickup to drop off.
- Responder can update status:
  - On the way.
  - Arrived at pickup.
  - Patient onboard.
  - Completed.
- User receives notification when responder marks `On the way`.

## Backend requirements

### Main entities

#### AmbulanceTransportRequest

Required fields:

- Request ID.
- Sender user ID.
- Request type.
- Status.
- Priority flags.
- Tanza citizen priority fields.
- Proof of indigency file reference.
- Valid ID file reference.
- Face capture file reference.
- Patient information.
- Accompanying person information.
- Pickup GeoJSON point and address label.
- Drop off GeoJSON point and address label.
- Requested date and time for Schedule and Transfer.
- Expected transport duration.
- Assigned ambulance unit ID.
- Assigned responder ID.
- Admin reviewer ID.
- Review decision.
- Rejection reason.
- Timeline events.

#### AmbulanceUnit

Required fields:

- Unit ID.
- Ambulance number from 1 to 12.
- Plate number if available.
- Status.
- Assigned responder or driver.
- Current active request.
- Latest known location.
- Maintenance notes.
- Last status update.

### Availability logic

- Pending requests do not reserve ambulance capacity.
- Admin approval starts capacity reservation only when a specific ambulance unit is selected.
- A unit is unavailable when it is assigned to another active request for an overlapping time range.
- A unit is unavailable when its status is Maintenance or Out of service.
- Schedule and Transfer requests must be between 3:00 PM and 7:00 PM.
- Emergency requests bypass the Schedule and Transfer operating window.
- Emergency requests still require approval, assignment and audit log creation.

### API endpoints

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

### Socket.io events

```text
ambulance_request.created
ambulance_request.priority_emergency_created
ambulance_request.reviewed
ambulance_request.approved
ambulance_request.rejected
ambulance_request.assigned
ambulance_request.on_the_way
ambulance_request.arrived_pickup
ambulance_request.patient_onboard
ambulance_request.completed
ambulance_availability.updated
ambulance_shortage.critical
```

## Analytics requirements

Track:

- Total ambulance requests.
- Requests by type.
- Requests by barangay.
- Tanza citizen priority count.
- Approved, rejected and completed count.
- Emergency priority count.
- Average admin review time.
- Average dispatch time after approval.
- Ambulance unit utilization.
- No availability events.
- Transfer origin and destination hospitals.

## Acceptance criteria

- User can submit Emergency, Schedule and Transfer ambulance requests.
- Proof of indigency is required.
- Tanza citizen priority is captured and shown to admin.
- Schedule and Transfer only allow 3:00 PM to 7:00 PM.
- Schedule and Transfer requests can overlap if different physical ambulance units are available.
- A request does not reserve ambulance capacity while pending review.
- Admin can approve or reject a request.
- Emergency requests are pinned above other requests and visually highlighted.
- Admin can assign one of the 12 physical ambulance units after approval.
- If all physical ambulance units are unavailable, the system shows a no availability state.
- Selected responder receives pickup and drop off details.
- User receives notification when ambulance is on the way.
- Completed requests appear in analytics and records.
