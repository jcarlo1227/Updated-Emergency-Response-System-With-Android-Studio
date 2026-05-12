# SafeAlert Admin Dashboard and Ambulance Assignment Update

## Purpose

Implement the latest SafeAlert admin dashboard updates so Codex can apply them consistently across the frontend and backend.

This update focuses on:

1. Fixing the Ambulance Request Detail assignment modal.
2. Filtering the responder dropdown so only active or on-duty responders are shown.
3. Adding an emergency notification sound in the admin dashboard.
4. Improving UI/UX using `UI_UX-Promax.md`.
5. Preventing invalid responder assignments through frontend and backend validation.

---

## Affected Areas

### Admin Web Dashboard

- Ambulance Request Detail page
- Assign Ambulance Unit modal
- Select Responder dropdown
- Admin notification system
- Map Center
- Live incidents or emergency alert listener
- Dashboard state refresh after assignment

### Backend API

- Ambulance request assignment endpoint
- Responder query/filter logic
- Emergency notification state or acknowledgement handling
- Server-side assignment validation

---

# 1. Fix Ambulance Request Detail Assignment Modal

## Current Issue

The current assignment modal allows the admin to view or select responders without properly filtering them by active duty status. This can lead to assigning an ambulance request to a responder who is off duty, busy, inactive, pending, rejected, unavailable, or not approved.

## Required Behavior

In the `Select Responder` dropdown, only show responders who are currently active, approved, and available for dispatch.

---

## Responder Filtering Requirements

Only include responders who meet all required conditions:

```ts
responder.isApproved === true
responder.approvalStatus === "approved"
```

And at least one active-duty condition:

```ts
responder.dutyStatus === "on_duty"
responder.dutyStatus === "available"
responder.isOnDuty === true
```

Exclude responders with any of the following statuses:

```ts
"off_duty"
"busy"
"unavailable"
"inactive"
"rejected"
"pending"
"not_approved"
```

---

## Frontend Filtering Logic

Use this logic or equivalent:

```ts
const activeResponders = responders
  .filter((responder) => {
    const approved =
      responder.isApproved === true &&
      responder.approvalStatus === "approved";

    const activeDuty =
      responder.isOnDuty === true ||
      responder.dutyStatus === "on_duty" ||
      responder.dutyStatus === "available";

    const excludedStatuses = [
      "busy",
      "off_duty",
      "inactive",
      "unavailable",
      "rejected",
      "pending",
      "not_approved",
    ];

    const notExcluded = !excludedStatuses.includes(
      String(responder.dutyStatus || "").toLowerCase()
    );

    return approved && activeDuty && notExcluded;
  })
  .sort((a, b) => {
    const departmentCompare = String(a.department || a.role || "").localeCompare(
      String(b.department || b.role || "")
    );

    if (departmentCompare !== 0) return departmentCompare;

    return String(a.name || "").localeCompare(String(b.name || ""));
  });
```

---

## Dropdown Display Requirements

When displaying each available responder, show:

- Full name
- Role or department
- Badge ID, if available
- Duty status
- Current distance from incident, if both responder and incident locations are available

Suggested display format:

```txt
Juan Dela Cruz
Medic · Badge ID: MDRRMO-001 · Available · 1.8 km away
```

If distance is unavailable:

```txt
Juan Dela Cruz
Medic · Badge ID: MDRRMO-001 · Available
```

---

## Empty State

If there are no active responders available, display:

```txt
No active responders available
```

Also disable the final assign or confirm button.

---

## Assignment Validation

The admin must not be allowed to assign an ambulance request unless both are selected:

1. Ambulance unit
2. Active responder

Frontend validation message examples:

```txt
Please select an ambulance unit.
Please select an active responder.
No active responders are available for assignment.
```

---

# 2. Backend Validation for Responder Assignment

## Required Backend Rule

Do not rely only on frontend filtering. Before assigning an ambulance request to a responder, validate on the backend that the selected responder is approved and currently active or available.

## Backend Validation Requirements

Before completing the assignment:

1. Find the selected responder by ID.
2. Confirm the responder exists.
3. Confirm the responder is approved.
4. Confirm the responder is on duty or available.
5. Confirm the responder is not busy, inactive, unavailable, rejected, pending, or off duty.
6. Reject the request if the responder is invalid.

## Suggested Backend Logic

```ts
const responder = await Responder.findById(responderId);

if (!responder) {
  return res.status(404).json({
    message: "Responder not found.",
  });
}

const approved =
  responder.isApproved === true &&
  responder.approvalStatus === "approved";

const activeDuty =
  responder.isOnDuty === true ||
  responder.dutyStatus === "on_duty" ||
  responder.dutyStatus === "available";

const excludedStatuses = [
  "busy",
  "off_duty",
  "inactive",
  "unavailable",
  "rejected",
  "pending",
  "not_approved",
];

const notExcluded = !excludedStatuses.includes(
  String(responder.dutyStatus || "").toLowerCase()
);

if (!approved || !activeDuty || !notExcluded) {
  return res.status(400).json({
    message: "Selected responder is not currently active or available.",
  });
}
```

---

# 3. Refresh State After Successful Assignment

After a successful ambulance assignment, refresh the following:

- Ambulance request detail
- Ambulance unit availability
- Responder availability
- Admin dashboard summary
- Notifications
- Live incidents or active request list, if applicable

The UI should reflect the updated assignment immediately without requiring a manual page refresh.

---

# 4. Admin Emergency Notification Sound

## Required Behavior

When a new emergency alert appears in the admin dashboard, play a notification sound every 3 seconds until the admin opens the map or views the emergency location in Map Center.

## Trigger Condition

Start the repeating notification sound when:

- A new emergency alert is received by the admin dashboard
- The emergency is not yet acknowledged by the admin
- The emergency has not yet been opened in the map or Map Center

## Stop Condition

Stop the repeating notification sound when the admin does any of the following:

1. Opens the Map Center for the new emergency.
2. Clicks the new emergency alert and views its location on the map.
3. Marks the notification as viewed or acknowledged.
4. Opens the incident detail page that includes the map location.

## Notification Sound Rules

- Play the sound once every 3 seconds.
- Do not create multiple overlapping intervals for the same emergency.
- Do not play multiple sounds at the same time.
- Stop the sound immediately when the admin opens the map or acknowledges the emergency.
- Respect browser autoplay restrictions. If the browser blocks sound before user interaction, show a visible notification prompt instead.
- The sound should be urgent but not excessively loud or distracting.
- Add a fallback visual notification badge if audio cannot play.

---

## Suggested Frontend Logic

```ts
const notificationAudio = new Audio("/sounds/emergency-alert.mp3");

let emergencySoundInterval: ReturnType<typeof setInterval> | null = null;

function startEmergencySound() {
  if (emergencySoundInterval) return;

  notificationAudio.play().catch(() => {
    // Browser may block autoplay before user interaction.
    // Show visual notification fallback.
  });

  emergencySoundInterval = setInterval(() => {
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(() => {
      // Keep visual fallback active if sound is blocked.
    });
  }, 3000);
}

function stopEmergencySound() {
  if (emergencySoundInterval) {
    clearInterval(emergencySoundInterval);
    emergencySoundInterval = null;
  }

  notificationAudio.pause();
  notificationAudio.currentTime = 0;
}
```

---

## Suggested Emergency Alert State

Track whether an emergency has already been acknowledged or opened.

Example:

```ts
type AdminEmergencyNotification = {
  emergencyId: string;
  isAcknowledged: boolean;
  openedInMap: boolean;
  createdAt: string;
};
```

Stop the sound when:

```ts
notification.isAcknowledged === true || notification.openedInMap === true
```

---

## Map Opening Behavior

When the admin opens the map for a new emergency:

1. Stop the notification sound.
2. Mark the emergency notification as acknowledged.
3. Center the map on the emergency GPS coordinates.
4. Show the emergency marker.
5. Show sender details and emergency type.
6. Keep the emergency visible in the active incident list unless it is resolved.

---

# 5. UI/UX Improvements

Apply the design and usability rules from:

```txt
UI_UX-Promax.md
```

Keep the current SafeAlert design direction but improve quality, spacing, and accessibility. Do not redesign too far from the existing interface.

## Modal UI/UX Requirements

Improve the assignment modal with:

- Larger padding
- Better spacing between sections
- Clear section labels
- Stronger visual hierarchy
- Proper modal max width
- Responsive behavior on smaller screens
- Clear close or back button
- Escape key support
- Outside click close behavior
- Focus trap inside modal
- Visible focus states
- Disabled button state
- Loading state during assignment
- Clear error and success messages

## Minimum Interaction Requirements

Follow these rules:

- Touch targets must be at least 44px tall.
- Form fields must have visible labels.
- Dropdowns must be keyboard accessible.
- Buttons must show hover, focus, pressed, disabled, and loading states.
- The confirm button must be disabled until all required selections are valid.
- Do not rely on color alone to communicate status.
- Use readable text contrast.
- Avoid layout shift when dropdowns or error messages appear.

---

# 6. Acceptance Criteria

The update is complete when all criteria below are met.

## Ambulance Assignment Modal

- The responder dropdown only shows approved responders who are on duty or available.
- Off-duty, busy, inactive, unavailable, pending, rejected, and unapproved responders are not shown.
- Responders are sorted by department or role, then by name.
- If no active responders exist, the dropdown shows `No active responders available`.
- The assign button is disabled if no ambulance unit is selected.
- The assign button is disabled if no active responder is selected.
- The selected responder details are displayed clearly.
- The modal can be closed using a visible close button.
- The modal can be closed using the Escape key.
- The modal is responsive and does not overflow awkwardly.
- The backend rejects invalid responder assignments.

## Notification Sound

- A new emergency alert triggers a sound.
- The sound repeats every 3 seconds.
- The sound stops when the admin opens the map or views the emergency location.
- The sound does not create overlapping loops.
- A fallback visual notification appears if browser audio autoplay is blocked.
- The emergency remains visible until resolved or handled according to existing workflow.

## UI/UX

- The modal follows the current SafeAlert visual direction.
- UI spacing and padding are improved.
- Labels, states, and validation messages are clear.
- Accessibility and keyboard interaction are improved.
- The update follows `UI_UX-Promax.md`.

---

# 7. Testing Checklist

## Frontend Tests

- [ ] Load Ambulance Request Detail page.
- [ ] Open Assign Ambulance Unit modal.
- [ ] Confirm only active or on-duty responders appear.
- [ ] Confirm busy and off-duty responders do not appear.
- [ ] Confirm pending or rejected responders do not appear.
- [ ] Select an ambulance unit.
- [ ] Select an active responder.
- [ ] Confirm selected responder details appear.
- [ ] Submit assignment.
- [ ] Confirm request detail refreshes after assignment.
- [ ] Confirm responder list refreshes after assignment.
- [ ] Confirm modal loading state works.
- [ ] Confirm error state works.
- [ ] Confirm close button works.
- [ ] Confirm Escape key closes modal.
- [ ] Confirm layout works on smaller screens.

## Backend Tests

- [ ] Assign with valid active responder succeeds.
- [ ] Assign with off-duty responder fails.
- [ ] Assign with busy responder fails.
- [ ] Assign with pending responder fails.
- [ ] Assign with rejected responder fails.
- [ ] Assign with unapproved responder fails.
- [ ] Assign with invalid responder ID fails.
- [ ] Assign without ambulance unit fails.
- [ ] Assign without responder fails.

## Notification Sound Tests

- [ ] Create or simulate new emergency alert.
- [ ] Confirm sound plays.
- [ ] Confirm sound repeats every 3 seconds.
- [ ] Open Map Center.
- [ ] Confirm sound stops immediately.
- [ ] Open incident map/details.
- [ ] Confirm sound stops immediately.
- [ ] Trigger multiple emergencies.
- [ ] Confirm no overlapping audio loops occur.
- [ ] Confirm fallback visual notification appears if sound is blocked.

---

# 8. Important Notes for Codex

- Do not remove existing SafeAlert features.
- Do not change unrelated modules.
- Do not redesign the full dashboard unless required by the modal and notification changes.
- Keep the existing routing and data structure unless a change is necessary.
- Preserve current styling direction while improving spacing, accessibility, and interaction quality.
- Add validation in both frontend and backend.
- Make the implementation production-safe and maintainable.
