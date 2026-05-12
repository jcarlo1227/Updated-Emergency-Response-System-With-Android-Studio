# SafeAlert Codex Implementation Instructions

## Purpose

Implement the requested SafeAlert system updates from the latest revision note. The updates affect the Admin Web Dashboard, Responder Mobile Application, shared backend data flow and overall UI/UX quality.

Source requirement summary:

- Admin Web Dashboard must show the sender's valid ID picture in Map Center incident details.
- Admin Web Dashboard must show the sender's profile or face picture and valid ID picture when opening an ambulance request form.
- Responder Mobile Application must submit responder update forms or field reports to the admin side.
- Submitted responder forms must appear in the admin Live Accidents or Live Incidents module and in admin notifications.
- Admin must be able to decide whether to resolve the incident or request another update from the responder.
- Responder Mobile Application UI must be fixed, especially missing back buttons.
- The whole system UI/UX must follow `UI_UX-Promax.md` and `Design_capstone.pdf`, while improving quality without changing too far from the existing design.

## Important Project Context

The project is a capstone system named Smart Emergency Alert System or SafeAlert. It includes:

- Admin Web Dashboard for MDRRMO or admin personnel
- User Mobile Application
- Responder Mobile Application
- Backend API
- MongoDB Atlas database
- IoT keychain device connected through BLE
- GPS and OpenStreetMap based emergency monitoring

Before editing, inspect the repository structure and locate the actual file names, route names, model names and component names. Do not assume exact paths if the repo already uses different naming.

## Non-Negotiable Rules

1. Do not rewrite the whole system.
2. Preserve the existing system design direction from `Design_capstone.pdf`.
3. Improve the UI professionally, but do not create a completely different visual identity.
4. Use `UI_UX-Promax.md` as the UI/UX quality standard.
5. Do not remove existing working features.
6. Do not hardcode user images, IDs, responder names, alert IDs or mock records into production screens.
7. Use existing API patterns, service files, state management patterns and folder conventions.
8. Protect sensitive user documents such as valid ID and face capture images.
9. Add proper loading, empty, error and unauthorized states.
10. Run available lint, typecheck and build commands before finalizing.

## Global UI/UX Direction

Follow the existing capstone design but refine it with better spacing, hierarchy and usability.

Required UI standards:

- Minimum touch target: 44px for mobile, preferably 48dp on Android.
- Use visible page titles and clear section labels.
- Every nested mobile screen must have a back button or predictable system back behavior.
- Use consistent card spacing, border radius, shadows and typography.
- Use SVG or framework icons, not emojis, for structural UI icons.
- Keep emergency actions visually clear and high contrast.
- Use visible labels for all forms, not placeholder-only labels.
- Show form errors near the related field.
- Add loading states for image loading, API fetches and submissions.
- Add empty states when no reports, no notifications or no image is available.
- Do not rely on color alone to communicate alert status.
- Ensure text contrast is readable in light and dark surfaces.
- Avoid cramped tables, tiny action buttons and hidden clickable areas.

Suggested visual direction:

- Keep the system professional, municipal and emergency-response appropriate.
- Use a clean command-center style for the Admin Web Dashboard.
- Use clear mobile-first layouts for user and responder apps.
- Maintain the existing emergency colors but organize them through semantic tokens.
- Use consistent statuses: Pending, Responding, Resolved, Needs Update and Needs Admin Review.

## Task 1: Admin Web Dashboard, Map Center Incident Details

### Goal

When the admin opens or views incident details in Map Center, the panel or modal must also display the sender's valid ID picture.

### Required Behavior

When an alert marker or incident detail is opened in Map Center:

1. Fetch the incident details.
2. Fetch or include the linked sender/user details.
3. Display the sender's valid ID picture in the incident details view.
4. Show a clear fallback if the valid ID picture is missing.
5. Restrict the valid ID picture to authorized admin users only.

### Suggested UI Layout

Inside the incident detail panel or modal, add a section:

```text
Sender Verification
- Profile / Face Photo
- Valid ID Photo
- Verification Status
```

Display the valid ID as a card with:

- Thumbnail preview
- Label: Valid ID
- Status: Available or Not Uploaded
- Click or tap to enlarge preview if supported
- Loading skeleton while image is loading
- Error state if image fails to load

### Data Handling

Use the existing sender fields if available. Search for these or equivalent field names:

- `validId`
- `validIdUrl`
- `validIdImage`
- `validIdPhoto`
- `proofOfResidencyField`
- `credentialFileId`
- `faceCaptureField`
- `profileImage`
- `photoUrl`

If images are stored as file IDs rather than direct URLs, use the existing backend file route or create a protected route that returns the image only to authorized users.

### Acceptance Criteria

- Admin can open Map Center incident details.
- The sender's valid ID picture is visible if available.
- Missing ID does not break the UI.
- Unauthorized users cannot access the ID image endpoint.
- The UI remains clean and consistent with the existing dashboard design.

## Task 2: Admin Web Dashboard, Ambulance Request Details

### Goal

When an admin opens an ambulance request form or request detail page, display the sender's profile or face picture and valid ID picture.

### Required Behavior

When an ambulance request is opened:

1. Load ambulance request details.
2. Load linked sender/user details.
3. Display sender face/profile photo.
4. Display sender valid ID photo.
5. Display clear empty states for missing images.
6. Keep the request form readable and professionally structured.

### Suggested UI Structure

Use a two-column detail layout on desktop and a single-column layout on mobile.

Recommended sections:

```text
Ambulance Request Details
- Request type
- Patient name
- Contact number
- Pickup location
- Drop-off location
- Medical condition
- Schedule or emergency time

Sender Verification
- Sender name
- Sender contact number
- Face or profile photo
- Valid ID photo
- Account approval status
```

### Acceptance Criteria

- Opening an ambulance request displays sender identity images when available.
- Profile or face photo and valid ID photo are clearly labeled.
- Image loading, missing image and image error states are handled.
- Layout works on desktop and smaller dashboard widths.
- Sensitive images are not exposed to unauthenticated users.

## Task 3: Responder Mobile Field Report or Update Form Flow

### Goal

When a responder receives an emergency and submits a form or field report, the submitted form must appear in the admin Live Accidents or Live Incidents module and also create an admin notification.

### Required Behavior

1. Responder receives or opens an emergency incident.
2. Responder submits a field report or incident update form.
3. Backend stores the report and links it to the correct alert or incident.
4. Admin dashboard displays the submitted report in Live Accidents or Live Incidents.
5. Admin notification is created when a new responder report is submitted.
6. Admin can review the report and choose one of these actions:
   - Mark incident as resolved
   - Ask responder for another update
7. If admin asks for an update, the responder receives a notification or visible update request.
8. Responder can submit a follow-up update linked to the same incident.
9. The incident should not automatically become resolved unless the admin or authorized workflow confirms it.

### Suggested Data Model

Use existing models if they already exist. If not, add or extend models carefully.

Suggested `ResponderReport` fields:

```ts
{
  _id: ObjectId,
  alertId: ObjectId,
  responderId: ObjectId,
  responderName?: string,
  reportType: 'arrival' | 'field_report' | 'follow_up' | 'resolution_request',
  summary: string,
  actionsTaken?: string,
  peopleAssisted?: boolean,
  transferred?: boolean,
  needsAdminReview?: boolean,
  attachments?: string[],
  status: 'submitted' | 'reviewed' | 'needs_update' | 'accepted',
  createdAt: Date,
  updatedAt: Date
}
```

Suggested `AdminUpdateRequest` fields:

```ts
{
  _id: ObjectId,
  alertId: ObjectId,
  reportId?: ObjectId,
  adminId: ObjectId,
  responderId: ObjectId,
  message: string,
  status: 'pending' | 'answered' | 'cancelled',
  createdAt: Date,
  updatedAt: Date
}
```

Suggested `Notification` fields:

```ts
{
  _id: ObjectId,
  recipientRole: 'admin' | 'responder' | 'user',
  recipientId?: ObjectId,
  type: 'responder_report_submitted' | 'admin_update_requested' | 'incident_resolved',
  alertId: ObjectId,
  title: string,
  message: string,
  isRead: boolean,
  createdAt: Date
}
```

### Suggested Backend API

Adapt names to the existing backend route style.

```http
POST /api/alerts/:alertId/responder-reports
GET /api/alerts/:alertId/responder-reports
GET /api/admin/live-incidents/:alertId/reports
POST /api/admin/alerts/:alertId/request-update
PATCH /api/admin/alerts/:alertId/resolve
GET /api/notifications
PATCH /api/notifications/:id/read
```

Required backend validation:

- Only assigned or authorized responders can submit a report for an alert.
- Only admin or authorized MDRRMO personnel can request updates or resolve incidents.
- The report must be linked to an existing alert.
- Required text fields must not be empty.
- Invalid IDs must return clear errors.

### Admin Dashboard Requirements

In Live Accidents or Live Incidents:

1. Add a responder reports section inside the incident detail view.
2. Show latest submitted report first.
3. Show responder name, timestamp, report summary, actions taken and status.
4. Show a badge when the report needs admin review.
5. Add action buttons:
   - Mark as Resolved
   - Ask for Update
6. If Ask for Update is selected, show a modal with a required message field.
7. After sending the update request, create a responder notification.

### Responder Mobile Requirements

In the responder app:

1. Show the assigned emergency details.
2. Allow responder to submit field report or update form.
3. Show submission loading state.
4. Show success message after submission.
5. If admin asks for an update, show the update request in notifications or incident details.
6. Allow responder to submit follow-up update.
7. Add back button to all nested screens.

### Acceptance Criteria

- Responder can submit a field report for an assigned emergency.
- Report appears in admin Live Accidents or Live Incidents.
- Admin receives a notification for the report.
- Admin can mark the incident as resolved after review.
- Admin can request another update from the responder.
- Responder can see and answer the admin update request.
- No duplicate reports are created from double tapping submit.
- Backend prevents unauthorized report submission.

## Task 4: Fix Missing Back Buttons in Responder Mobile App

### Goal

Improve responder app navigation by adding proper back navigation to all nested screens.

### Required Screens to Check

Inspect the responder app and fix screens such as:

- Emergency Details
- Route Mode
- Field Report
- Account Status
- Notifications
- Report History
- Profile or Settings
- Any modal-like full screen view

### Required Behavior

1. Every nested page must show a visible back button in the top app bar.
2. Back button must return to the previous logical screen.
3. Android system back must behave consistently with the visible back button.
4. Do not place the back button too close to the device safe area edge.
5. Back button must have accessible label or semantic label.

### UI Requirement

Use the existing icon library or platform back icon. Do not use emoji. Do not use a plain text-only back link unless that is already the app standard.

Suggested label:

```text
Back
```

Suggested semantics:

```text
accessibilityLabel: Back to previous screen
```

### Acceptance Criteria

- All nested responder app screens have a working back button.
- Back navigation does not reset required incident state unexpectedly.
- Unsaved field reports show a confirmation before leaving.
- UI follows safe area rules.

## Task 5: Whole System UI/UX Upgrade

### Goal

Upgrade the UI/UX across the system using `UI_UX-Promax.md` and `Design_capstone.pdf`, while staying close to the current design.

### Scope

Apply the upgrade to:

- Admin Web Dashboard
- User Mobile Application
- Responder Mobile Application
- Forms
- Tables
- Incident detail modals
- Map panels
- Notifications
- Field report flow
- Ambulance request flow

### Required Improvements

#### Admin Web Dashboard

- Improve dashboard spacing, card consistency and table readability.
- Improve Map Center incident detail panel.
- Improve Ambulance Request detail form layout.
- Add clear status badges.
- Add skeleton loading for dashboard cards, maps and details.
- Use consistent modals or side sheets for details.
- Keep primary admin actions easy to find.
- Separate destructive actions from normal actions.

#### User Mobile Application

- Improve emergency button layout without changing the emergency categories.
- Keep emergency alert buttons highly visible.
- Improve ambulance request form readability.
- Make multi-step forms clearer with step indicators.
- Add consistent success, pending and error states.
- Ensure all critical buttons meet touch target sizes.

#### Responder Mobile Application

- Add missing back buttons.
- Improve incident details screen.
- Improve field report screen.
- Improve route mode screen.
- Improve notification screen.
- Keep response actions visible and easy to use in the field.
- Avoid overly decorative UI because responders need speed and clarity.

### Design Token Requirements

If the project has theme tokens, use them. If not, create or consolidate tokens without breaking existing style.

Suggested token categories:

```ts
colors: {
  primary,
  primaryDark,
  danger,
  warning,
  success,
  info,
  background,
  surface,
  border,
  textPrimary,
  textSecondary,
  muted
}

spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
}

radius: {
  sm,
  md,
  lg,
  xl
}

shadow: {
  sm,
  md,
  lg
}
```

Do not scatter raw hex values across components if a token system exists.

## Backend and Security Requirements

Because the requested features display valid ID and face images, treat them as sensitive personal information.

Required protections:

1. Image endpoints must require authentication.
2. Admin-only images must require admin authorization.
3. Responders should only see user identity documents if needed for an assigned active incident.
4. Do not expose image storage paths directly if the project uses protected file serving.
5. Do not include sensitive image URLs in public logs.
6. Validate all route params and request bodies.
7. Avoid returning full user records if only selected fields are needed.

Suggested safe user fields for incident detail:

```ts
{
  _id,
  fullName,
  phone,
  address,
  bloodType,
  emergencyContact,
  facePhotoUrl,
  validIdPhotoUrl,
  approvalStatus
}
```

## Edge Cases to Handle

- Sender has no uploaded valid ID.
- Sender has no face or profile photo.
- Image URL is expired or inaccessible.
- Admin opens incident while data is still loading.
- Responder submits the same report twice due to repeated tapping.
- Responder loses connection during report submission.
- Admin requests an update after incident has already been resolved.
- Alert has no assigned responder yet.
- User record was deleted or cannot be found.
- Mobile device uses Android back gesture instead of the visible back button.

## Testing Checklist

Before final output, verify the following:

### Admin Web

- Map Center incident details show valid ID photo.
- Ambulance request details show sender face or profile photo and valid ID photo.
- Missing images show clean fallback states.
- Live Incidents or Live Accidents shows responder reports.
- Admin notification appears after responder report submission.
- Admin can request update from responder.
- Admin can mark incident as resolved after review.

### Responder Mobile

- Emergency details screen has back button.
- Route screen has back button.
- Field report screen has back button.
- Field report submission works.
- Follow-up update submission works.
- Notifications show admin update requests.
- Unsaved form exit is handled safely.

### Backend

- Field reports are stored and linked to alert ID.
- Admin notifications are created.
- Update requests are stored and linked to responder ID.
- Authorization rules work.
- Image routes are protected.
- Duplicate submission protection exists.

### UI/UX

- Touch targets are large enough.
- Text is readable.
- Buttons have loading states.
- Forms have visible labels.
- Errors appear near the related fields.
- There is no horizontal overflow on mobile.
- The updated design stays close to the existing capstone design.

## Suggested Implementation Order

1. Inspect current repository structure.
2. Locate existing models for users, alerts, ambulance requests, notifications and responder reports.
3. Update or add backend schema and routes for responder reports and admin update requests.
4. Add or update protected API response fields for sender face photo and valid ID photo.
5. Update Admin Map Center incident details.
6. Update Admin Ambulance Request details.
7. Update Admin Live Incidents or Live Accidents report display.
8. Add admin notification creation and display for responder submitted reports.
9. Update Responder Mobile field report submission flow.
10. Add admin update request visibility in Responder Mobile.
11. Fix back buttons and navigation behavior in Responder Mobile.
12. Apply UI/UX refinements using `UI_UX-Promax.md` and `Design_capstone.pdf`.
13. Run tests, lint, typecheck and builds.
14. Document changed files and any assumptions.

## Final Codex Response Format

After implementation, respond with:

```text
Implemented updates:
1. ...
2. ...
3. ...

Files changed:
- ...

Validation performed:
- ...

Notes / assumptions:
- ...
```

If a required file or referenced document such as `Design_capstone.pdf` is missing, do not stop immediately. Continue using the existing UI as the design reference, follow `UI_UX-Promax.md` and mention the missing file in the final notes.
