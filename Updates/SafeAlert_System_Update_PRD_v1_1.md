# SafeAlert System Update PRD

## 1. Document Information

**Project Name:** SafeAlert Emergency Response System  
**Update Version:** PRD Update v1.1  
**System Scope:** Tanza Municipality Emergency Response Platform  
**Platforms Covered:** User Mobile App, Responder Mobile App, Admin Web Dashboard and Backend API  
**Document Purpose:** This document combines all system update requirements into one product requirements document for implementation.

---

## 2. Update Objective

This update improves the SafeAlert system by making registration, emergency reporting, ambulance transport, responder management, approval screening, system monitoring, reports, audit logs, settings and admin notifications more complete and easier to use.

The main goal is to make the system more operational for real emergency response use in Tanza Municipality. The update focuses on better data collection, live status tracking, proper admin controls, real-time notifications and cleaner information display.

---

## 3. Key Problems to Solve

1. User registration is missing important medical information.
2. Emergency banners stay visible even after an emergency is cancelled or resolved.
3. Ambulance request form lacks pickup and drop-off location selection.
4. Ambulance request status should not be manually clickable by admin.
5. Create responder function in admin dashboard is not working.
6. Map emergency markers do not show complete sender details.
7. Approval center lacks a detailed screening view.
8. Reports and analytics are static instead of live.
9. Audit logs are hard to understand.
10. Settings page does not feel like a real usable settings module.
11. Database and system status information in the overview is not useful enough.
12. Admin users may miss new ambulance requests or emergency requests when they are on another dashboard page.

---

## 4. Mobile User App Updates

### 4.1 Mobile User Registration Update

#### Requirement

The user registration form must collect additional emergency and medical details.

#### New Required Fields

| Field | Type | Required | Description |
|---|---|---|---|
| Full Name | Text | Yes | User legal name |
| Age | Number | Yes | User age |
| Date of Birth | Date Picker | Yes | User birth date |
| Blood Type | Dropdown | Yes | A+, A-, B+, B-, AB+, AB-, O+ or O- |
| Address | Text | Yes | Residential address |
| Face Photo | Image Upload or Camera | Yes | Used for verification |
| Valid ID | Image Upload or Camera | Yes | Used for approval screening |
| Emergency Contact Person | Text | Yes | Contact person name |
| Emergency Contact Number | Phone | Yes | Contact number |
| Email or Phone Login Field | Text | Yes | For account access |
| Password | Password | Yes | Secure login |

#### Acceptance Criteria

1. User cannot submit registration if age, date of birth or blood type is missing.
2. Blood type must use a dropdown to avoid invalid values.
3. Age should match the date of birth or the system should show a warning.
4. These fields must appear in the admin approval center.
5. These fields must appear when the admin clicks a map emergency marker.

---

### 4.2 Mobile User Emergency Banner Update

#### Requirement

The emergency status banner shown at the top of the mobile app must disappear once the emergency is either cancelled or resolved.

#### Expected Behavior

| Emergency Status | Banner Behavior |
|---|---|
| Pending | Show banner |
| Dispatched | Show banner |
| In Progress | Show banner |
| Cancelled | Remove banner |
| Resolved | Remove banner |
| Completed | Remove banner |

#### Acceptance Criteria

1. Banner appears only for active emergency cases.
2. Banner automatically disappears when the backend status becomes cancelled, resolved or completed.
3. User should not need to restart the app to remove the banner.
4. If sockets are enabled, the banner must update in real time.
5. If sockets are unavailable, the app should refresh status when the screen reloads.

---

### 4.3 Ambulance Request Form Update

#### Requirement

The ambulance request form must include pickup and drop-off location fields.

#### Required Form Fields

| Field | Type | Required | Description |
|---|---|---|---|
| Patient Name | Text | Yes | Name of patient |
| Contact Number | Phone | Yes | Requester or patient number |
| Medical Concern | Text Area | Yes | Reason for ambulance request |
| Pickup Location | Map Picker | Yes | Where ambulance will pick up patient |
| Drop-off Location | Search or Map Picker | Yes | Hospital or destination |
| Notes | Text Area | No | Additional information |
| Request Date and Time | Auto Generated | Yes | Timestamp |

#### Pickup Location Function

When the user clicks **Pickup Location**, the app must open a map screen with two options:

1. Use Current Location
2. Choose Location on Map

The selected pickup location must save:

```text
pickupLatitude
pickupLongitude
pickupAddress
```

#### Drop-off Location Function

When the user clicks **Drop-off Location**, the app must allow:

1. Search for a destination
2. Choose a location from the map

The selected drop-off location must save:

```text
dropoffLatitude
dropoffLongitude
dropoffAddress
```

#### Acceptance Criteria

1. Ambulance request cannot be submitted without pickup and drop-off locations.
2. Pickup location can use current GPS location.
3. Drop-off location can be searched or manually selected on the map.
4. Selected locations must display as readable addresses.
5. Backend must store both coordinates and address text.

---

### 4.4 Ambulance Request Status Button

#### Requirement

The ambulance request form must have a button that allows the user to view the status of the submitted ambulance request.

#### Button Label

```text
View Request Status
```

#### Status Screen Must Show

| Data | Description |
|---|---|
| Request ID | Unique request number |
| Current Status | Pending, Approved, On the Way, Completed or Rejected |
| Assigned Ambulance Unit | Vehicle or unit name |
| Plate Number | Ambulance plate number |
| Assigned Responder | Name of assigned responder |
| Pickup Location | Address |
| Drop-off Location | Address |
| Date Submitted | Timestamp |
| Last Updated | Timestamp |

#### Acceptance Criteria

1. User can open status after submitting an ambulance request.
2. Status must update from backend data.
3. Status screen must not show fake or static values.
4. If rejected, the reason must be visible to the user.
5. If completed, the request should move to history.

---

### 4.5 Ambulance Transport History

#### Requirement

The user mobile app must include a history page for ambulance transport requests.

#### History List Must Show

| Data | Description |
|---|---|
| Request Date | Date submitted |
| Pickup Location | Origin |
| Drop-off Location | Destination |
| Status | Completed, Rejected or Cancelled |
| Assigned Unit | Ambulance unit used |
| Plate Number | Vehicle plate number |

#### Acceptance Criteria

1. User can view past ambulance requests.
2. Active requests and completed requests must be separated.
3. Completed, cancelled and rejected requests must move to history.
4. History must be pulled from backend records.

---

## 5. Responder Mobile App Updates

### 5.1 Responder Registration Approval Flow

#### Requirement

Once a responder registration is approved, the responder must automatically appear in:

1. Approved Responders
2. Available Responders

#### Expected Flow

```text
Responder submits registration
Admin reviews responder in Approval Center
Admin approves responder
Responder moves to Approved Responders
Responder appears in Available Responders list
```

#### Acceptance Criteria

1. Newly approved responder appears in the approved responder table.
2. Newly approved responder appears in dispatch selection as available.
3. Responder status defaults to Available after approval.
4. Admin can later update responder status to Busy, Offline or Suspended.

---

## 6. Admin Dashboard Updates

### 6.1 Overview Dashboard Improvement

#### Requirement

The admin overview must become useful and operational instead of being mostly static.

#### Updated Overview Cards

| Card | Description |
|---|---|
| Active Emergencies | Number of unresolved emergency reports |
| Pending Ambulance Requests | Requests waiting for action |
| Available Responders | Responders currently available |
| Active Responders | Responders currently assigned |
| Pending Approvals | Users and responders waiting for approval |
| Resolved Today | Emergency cases resolved today |
| Average Response Time | Average dispatch response time |
| System Status | Backend, database, socket and map status |
| Database Storage | Available and used database storage |

#### System Status Section

System status must show:

| Status Item | Expected Display |
|---|---|
| API Server | Online or Offline |
| Database | Connected or Disconnected |
| Socket Server | Connected or Disconnected |
| Map Service | Active or Error |
| Storage Used | Example: 1.2 GB used |
| Storage Available | Example: 3.8 GB available |
| Last Backup | Date and time if available |

#### Backend Endpoint

```http
GET /api/admin/overview
```

#### Response Example

```json
{
  "activeEmergencies": 8,
  "pendingAmbulanceRequests": 3,
  "availableResponders": 12,
  "activeResponders": 5,
  "pendingApprovals": 6,
  "resolvedToday": 14,
  "averageResponseTime": "8 min",
  "systemStatus": {
    "api": "online",
    "database": "connected",
    "socket": "connected",
    "map": "active"
  },
  "databaseStorage": {
    "used": "1.2 GB",
    "available": "3.8 GB"
  }
}
```

#### Acceptance Criteria

1. Overview cards must use live backend data.
2. System status must not be hardcoded.
3. Database storage must display used and available storage if supported by the database provider.
4. If storage data is unavailable, show Not available instead of fake data.
5. Dashboard must refresh automatically or provide a manual refresh button.

---

### 6.2 Create Responder Fix

#### Requirement

The admin dashboard must allow admin users to create a new responder manually.

#### Create Responder Form Fields

| Field | Type | Required |
|---|---|---|
| Full Name | Text | Yes |
| Age | Number | Yes |
| Date of Birth | Date Picker | Yes |
| Address | Text | Yes |
| Contact Number | Phone | Yes |
| Email | Email | Yes |
| Role or Field | Dropdown | Yes |
| Assigned Unit | Dropdown | No |
| Plate Number | Auto from unit | No |
| Password | Password | Yes |
| Status | Dropdown | Yes |

#### Responder Roles

Suggested values:

```text
Medic
Fire Responder
Police Responder
Ambulance Driver
Disaster Response
General Responder
```

#### Acceptance Criteria

1. Admin can create a responder successfully.
2. Created responder appears in responder list.
3. If status is Available, responder appears in dispatch selection.
4. Validation must prevent duplicate email or phone number.
5. Error messages must clearly explain what failed.

---

### 6.3 Ambulance Request Admin Update

#### Requirement

The ambulance request status must not be clickable. It must auto update based on the request workflow.

#### Correct Status Flow

```text
Pending
Approved
Assigned
On the Way
Picked Up
Arrived at Drop-off
Completed
```

Alternative flow:

```text
Pending
Rejected
```

#### Admin Actions

| Action | Description |
|---|---|
| Open | View full request details |
| Assign Unit | Assign ambulance and responder |
| Reject | Reject with reason |
| Mark On the Way | Available after assignment |
| Mark Picked Up | Used when patient is picked up |
| Mark Completed | Used after drop-off is completed |

#### Rejected Request Rule

Rejected ambulance request records must disappear from the active rejected list after 31 days.

Recommended implementation:

1. Keep rejected records in database for audit.
2. Hide from default admin table after 31 days.
3. Optionally allow admin to filter archived rejected requests.

#### Action Open Details

When admin clicks **Open**, display:

| Data | Description |
|---|---|
| Requester Details | Name, contact, age and blood type |
| Medical Concern | Reason for ambulance request |
| Pickup Location | Address and map pin |
| Drop-off Location | Address and map pin |
| Assigned Responder | Name, role and contact |
| Assigned Unit | Ambulance unit name |
| Plate Number | Vehicle plate number |
| Status Timeline | Request progress history |

#### Acceptance Criteria

1. Status field is not clickable.
2. Status changes only through valid actions or responder updates.
3. Rejected requests are hidden after 31 days.
4. Open action shows responder details and ambulance unit details.
5. Plate number must be visible when a unit is assigned.

---

### 6.4 Real-Time Admin Notification Pop-Up

#### Requirement

The admin dashboard must show a real-time pop-up notification whenever a new ambulance request or emergency request is received. The notification must appear no matter which admin dashboard page the admin is currently viewing.

This is especially important for the Map Center so the admin will not miss active emergency reports.

#### Notification Triggers

The system must trigger a pop-up notification when:

| Event | Trigger |
|---|---|
| New Emergency Request | A user sends Crime, Fire, Medic or General SOS request |
| New IoT Emergency Request | A connected IoT keychain sends an emergency request through the mobile app |
| New Ambulance Request | A user submits an ambulance transport request |
| Emergency Status Update | Emergency status changes to urgent, dispatched, cancelled or resolved |
| Ambulance Status Update | Ambulance request changes to assigned, on the way, rejected or completed |

#### Notification Behavior

When a new request is received, the dashboard must display a pop-up notification with:

| Data | Description |
|---|---|
| Request Type | Emergency or Ambulance |
| Emergency Type | Crime, Fire, Medic or General SOS |
| Sender Name | Name of user who sent the request |
| Location | Address or coordinates |
| Time Received | Date and time of request |
| Priority | Normal, High or Critical |
| Action Button | Open Request or View on Map |

#### Pop-Up Display Rules

1. Notification must appear on every admin page.
2. Notification must appear even if the admin is not currently in Map Center.
3. Notification must have a sound alert for urgent requests.
4. Notification must remain visible until admin clicks View, Acknowledge or Dismiss.
5. If multiple requests arrive, notifications must stack or appear in a notification center.
6. The admin must be able to open the request directly from the notification.
7. Emergency requests must have a View on Map button.
8. Ambulance requests must have an Open Ambulance Request button.

#### Notification UI Example

Emergency request notification:

```text
🚨 New Emergency Request

Type: Medical Emergency
Sender: Juan Dela Cruz
Location: Tanza, Cavite
Time: 2:41 PM

[View on Map] [Acknowledge]
```

Ambulance request notification:

```text
🚑 New Ambulance Request

Patient: Maria Santos
Pickup: Barangay Daang Amaya
Drop-off: Hospital
Time: 2:45 PM

[Open Request] [Acknowledge]
```

#### Notification Center

The admin dashboard must also include a notification center icon in the top navigation bar.

The notification center must show:

| Data | Description |
|---|---|
| Unread Count | Number of unread notifications |
| Notification Type | Emergency or Ambulance |
| Message | Short description |
| Date and Time | When it was received |
| Status | Unread, Read or Acknowledged |
| Action | Open related request |

#### Backend Requirement

Create real-time socket events for admin notifications.

Suggested socket events:

```ts
new_emergency_request
new_ambulance_request
emergency_status_updated
ambulance_status_updated
```

Example payload:

```json
{
  "id": "notif_001",
  "type": "emergency",
  "requestId": "emg_123",
  "title": "New Medical Emergency",
  "message": "Juan Dela Cruz sent a Medical Emergency request.",
  "senderName": "Juan Dela Cruz",
  "emergencyType": "Medical Emergency",
  "location": {
    "address": "Tanza, Cavite",
    "latitude": 14.3949,
    "longitude": 120.8530
  },
  "priority": "critical",
  "createdAt": "2026-05-07T10:41:00.000Z",
  "status": "unread"
}
```

#### Frontend Requirement

The admin dashboard must have a global notification listener placed in the main dashboard layout, not inside only one page.

Recommended placement:

```text
AdminShell
GlobalNotificationProvider
NotificationToast
NotificationCenter
```

This ensures the notification works anywhere in the dashboard, including:

```text
Overview
Map Center
Ambulance Requests
Responders
Approval Center
Reports and Analytics
Audit Logs
Settings
```

#### Notification Storage

Notifications must be saved in the database so admins can still view missed notifications after refresh or logout.

Suggested notification model:

```ts
type AdminNotification = {
  id: string;
  type: "emergency" | "ambulance" | "system";
  requestId: string;
  title: string;
  message: string;
  priority: "normal" | "high" | "critical";
  status: "unread" | "read" | "acknowledged";
  createdAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
};
```

#### Acceptance Criteria

1. Admin receives a pop-up when a new emergency request is submitted.
2. Admin receives a pop-up when a new ambulance request is submitted.
3. Pop-up appears even if the admin is on a different dashboard page.
4. Emergency notification has a View on Map button.
5. Ambulance notification has an Open Request button.
6. Notification count updates in real time.
7. Notification is saved in the database.
8. Admin can mark a notification as acknowledged.
9. Critical emergency notifications must include a sound alert.
10. Notification system must work without refreshing the dashboard.

---

## 7. Map Center Update

### 7.1 Emergency Marker Details

#### Requirement

When the admin clicks an emergency icon on the map, the system must display all sender details collected during registration.

#### Marker Popup Must Show

| Data | Description |
|---|---|
| Emergency Type | Crime, Fire, Medic or General SOS |
| Sender Name | Registered name |
| Age | Registered age |
| Date of Birth | Registered date of birth |
| Blood Type | Registered blood type |
| Address | Registered address |
| Contact Number | User contact |
| Emergency Contact Person | Registered emergency contact |
| Emergency Contact Number | Emergency contact number |
| Face Photo | User verification photo |
| Current Location | GPS address |
| Latitude and Longitude | Coordinates |
| Time Reported | Emergency timestamp |

#### Acceptance Criteria

1. Clicking an emergency marker opens sender details.
2. Details must be fetched from backend.
3. Marker popup must not only show coordinates.
4. Admin can use the details to assess and dispatch responders.
5. If some user data is missing, show Not provided instead of blank fields.

---

## 8. Approval Center Update

### 8.1 Add Open Action Button

#### Requirement

The approval center must include an Open button for each pending user or responder registration.

#### Approval List Columns

| Column | Description |
|---|---|
| Name | Applicant name |
| Account Type | User or Responder |
| Date Submitted | Registration date |
| Status | Pending |
| Action | Open |

#### Open Details Modal or Page

When admin clicks Open, display:

| Data | Description |
|---|---|
| Full Name | Applicant name |
| Address | Applicant address |
| Age | Applicant age |
| Date of Birth | Applicant date of birth |
| Blood Type | For user accounts |
| Contact Number | Applicant contact |
| Email | Applicant email |
| Valid ID | Uploaded ID image |
| Face Photo | Uploaded face image |
| Responder Role | For responder accounts |
| Approval Controls | Approve or Reject |

#### Screening Action

Admin must be able to:

1. Approve registration
2. Reject registration
3. Add rejection reason

#### Acceptance Criteria

1. Every pending registration has an Open button.
2. Open button displays complete applicant details.
3. Valid ID and face photo must be visible.
4. Admin can approve or reject from the details view.
5. Approved users move to approved user records.
6. Approved responders move to approved responders and available responders.

---

## 9. Reports and Analytics Update

### 9.1 Live Reports

#### Requirement

Reports and analytics must use live backend data, not static placeholder values.

#### Must Include

| Report | Description |
|---|---|
| Total Incidents | All emergency reports |
| Incidents by Type | Crime, Fire, Medic or General SOS |
| Ambulance Transport Requests | All ambulance requests |
| Resolved Incidents | Completed emergency cases |
| Pending Incidents | Active unresolved cases |
| Average Response Time | Based on dispatch timestamps |
| Most Reported Areas | Barangay or location-based count |
| Responder Activity | Cases handled by responder |
| Ambulance Usage | Usage per ambulance unit |
| Monthly Trend | Incident and ambulance request trend |

#### Filters

Reports must support:

```text
Today
This Week
This Month
Custom Date Range
Incident Type
Barangay or Area
Responder
Ambulance Unit
```

#### Backend Endpoint

```http
GET /api/admin/reports
```

#### Acceptance Criteria

1. Reports show live database values.
2. Reports include incidents and ambulance transport data.
3. Filters must update charts and tables.
4. No static chart data should remain.
5. Empty reports must show a clear empty state.

---

## 10. Audit Logs Update

### 10.1 User-Friendly Audit Logs

#### Requirement

Audit logs must be readable and useful for admin users.

#### Current Problem

The audit logs are hard to understand. Admin users cannot easily tell what happened, who performed the action or why the log matters.

#### Updated Audit Log Format

| Column | Description |
|---|---|
| Date and Time | When action happened |
| Admin or User | Who performed the action |
| Action | What happened |
| Module | Where it happened |
| Reason | Why it matters |
| Related Record | Emergency ID, user ID or request ID |
| Severity | Info, Warning or Critical |

#### Human-Friendly Examples

Instead of:

```text
UPDATE_STATUS request_123
```

Show:

```text
Admin Mark updated ambulance request AR-123 from Assigned to On the Way.
Reason: Ambulance unit has started travel to pickup location.
```

Instead of:

```text
APPROVE_USER user_884
```

Show:

```text
Admin approved the user registration of Juan Dela Cruz.
Reason: Valid ID and face photo were verified.
```

#### Filters

Audit logs must support:

```text
Date Range
Module
Action Type
Admin or User
Severity
Search
```

#### Acceptance Criteria

1. Logs must be understandable without reading technical IDs only.
2. Each log must explain the action and reason.
3. Logs must be filterable.
4. Critical actions must be visually marked.
5. Logs must help admins review accountability and system activity.

---

## 11. Settings Update

### 11.1 Make Settings Usable

#### Requirement

Settings must look and function like a real configuration area.

#### Settings Sections

| Section | Purpose |
|---|---|
| Scope and Configuration | Municipality, barangays and service coverage |
| Ambulance Units | Add, edit and manage ambulance units |
| Emergency Types | Manage emergency categories |
| Responder Roles | Manage responder fields or roles |
| Notification Settings | Configure alerts |
| Account and Security | Admin profile and password |
| System Maintenance | Backup, logs and system checks |

---

### 11.2 Ambulance Units Settings

#### Requirement

Ambulance Units inside Scope and Configuration must be clickable and editable.

#### Admin Can

1. Add new ambulance unit
2. Edit ambulance unit
3. Update plate number
4. Set unit status
5. Assign or unassign responder
6. Disable inactive unit

#### Ambulance Unit Fields

| Field | Type | Required |
|---|---|---|
| Unit Name | Text | Yes |
| Plate Number | Text | Yes |
| Unit Type | Dropdown | Yes |
| Status | Dropdown | Yes |
| Assigned Driver | Dropdown | No |
| Notes | Text Area | No |

#### Unit Status Values

```text
Available
Assigned
Under Maintenance
Inactive
```

#### Acceptance Criteria

1. Admin can add another ambulance unit.
2. Admin can edit unit plate number.
3. Admin can change unit status.
4. Ambulance units must appear in ambulance request assignment.
5. Disabled units must not appear as available during dispatch.

---

## 12. Backend and Database Updates

### 12.1 User Model Update

Add fields:

```ts
age: number;
dateOfBirth: Date;
bloodType: string;
facePhotoUrl: string;
validIdUrl: string;
emergencyContactName: string;
emergencyContactNumber: string;
```

---

### 12.2 Ambulance Request Model Update

Add fields:

```ts
pickupLocation: {
  address: string;
  latitude: number;
  longitude: number;
};

dropoffLocation: {
  address: string;
  latitude: number;
  longitude: number;
};

assignedResponderId?: string;
assignedAmbulanceUnitId?: string;
plateNumber?: string;
status: "pending" | "approved" | "assigned" | "on_the_way" | "picked_up" | "arrived" | "completed" | "rejected";
rejectionReason?: string;
statusHistory: {
  status: string;
  updatedBy: string;
  updatedAt: Date;
  reason?: string;
}[];
```

---

### 12.3 Ambulance Unit Model

Create or update:

```ts
unitName: string;
plateNumber: string;
unitType: string;
status: "available" | "assigned" | "under_maintenance" | "inactive";
assignedDriverId?: string;
notes?: string;
createdAt: Date;
updatedAt: Date;
```

---

### 12.4 Audit Log Model Update

```ts
actorId: string;
actorName: string;
actorRole: string;
module: string;
action: string;
description: string;
reason: string;
relatedRecordId?: string;
severity: "info" | "warning" | "critical";
createdAt: Date;
```

---

### 12.5 Admin Notification Model

Create a model for persistent admin notifications:

```ts
type AdminNotification = {
  id: string;
  type: "emergency" | "ambulance" | "system";
  requestId: string;
  title: string;
  message: string;
  priority: "normal" | "high" | "critical";
  status: "unread" | "read" | "acknowledged";
  createdAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
};
```

---

## 13. Suggested Development Priority

### Phase 1: Critical Fixes

1. Fix React Leaflet map compatibility issue.
2. Add global real-time admin notification pop-ups for new emergency requests and ambulance requests.
3. Fix create responder function.
4. Fix admin map marker details.
5. Add approval center Open details view.
6. Add missing user registration fields.

### Phase 2: Ambulance Transport Workflow

1. Add pickup and drop-off map selection.
2. Add ambulance request status page.
3. Add ambulance transport history.
4. Add admin ambulance assignment workflow.
5. Add rejected request 31-day visibility rule.

### Phase 3: Admin Improvements

1. Improve overview dashboard with live metrics.
2. Make reports and analytics live.
3. Redesign audit logs.
4. Improve settings page.
5. Add ambulance unit management.
6. Add notification center with unread count and acknowledgement status.

### Phase 4: Testing and Validation

1. Test user registration.
2. Test responder registration approval.
3. Test emergency marker details.
4. Test ambulance request from submission to completion.
5. Test real-time notification pop-ups.
6. Test reports, logs and settings.

---

## 14. Success Criteria

This update is successful when:

1. User registration captures age, date of birth and blood type.
2. Admin can screen users and responders properly.
3. Emergency map markers show full sender details.
4. Ambulance request has pickup and drop-off location selection.
5. Ambulance status updates through proper workflow, not direct clicking.
6. Admin can create responders.
7. Approved responders appear in available responders.
8. Overview dashboard shows useful live data.
9. Reports and analytics are live.
10. Audit logs are readable and meaningful.
11. Settings page allows real system configuration.
12. Ambulance units can be added, edited and assigned.
13. Admin receives a real-time pop-up notification for every new emergency request.
14. Admin receives a real-time pop-up notification for every new ambulance request.
15. Notifications appear on all admin dashboard pages without refreshing.

---

## 15. Final Notes for Development

1. All static dashboard values must be replaced with live backend data.
2. All critical admin actions should create audit logs.
3. All emergency and ambulance request updates should trigger real-time socket events.
4. All notification records should be saved in the database.
5. The admin dashboard layout should contain the global notification listener so pop-ups work on every page.
6. The system must stay focused on Tanza Municipality as the initial deployment scope.
