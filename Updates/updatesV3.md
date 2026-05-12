# [cite_start]SafeAlert System – Detailed Revision Requirements & Development Constraints [cite: 1]

[cite_start]This document contains the revised and expanded feature requirements, bug fixes, implementation rules, and development constraints for the SafeAlert Emergency Response System. [cite: 2]

## [cite_start]IMPORTANT DEVELOPMENT RULES [cite: 2]

1. [cite_start]Existing working backend logic, APIs, authentication, database structures, routing, and socket events MUST NOT be removed, rewritten, or modified unless explicitly required for the new feature. [cite: 3]
2. [cite_start]Any new feature implementation must be backward compatible with all currently working modules. [cite: 4]
3. [cite_start]Existing working functionalities must remain operational after implementation. [cite: 5]
4. [cite_start]Refactoring existing code is NOT allowed unless the current implementation causes a bug, prevents the new feature from working, or the change is explicitly requested in this document. [cite: 5]
5. [cite_start]All changes must be additive and isolated whenever possible. [cite: 6]
6. [cite_start]Before editing any existing function, controller, API route, service, provider, socket event, or database query, verify whether it is currently used by another module. [cite: 6]
7. [cite_start]Preserve the original behavior, maintain response formats, and payload structures. [cite: 7]
8. [cite_start]DO NOT rename existing API endpoints, database columns, socket event names, authentication logic, Firebase configuration, Redux/Context state names, or provider/service class names unless absolutely necessary. [cite: 8]
9. [cite_start]UI redesign tasks must ONLY affect frontend presentation and styling unless functionality fixes are explicitly required. [cite: 9]
10. [cite_start]Existing login, registration, emergency creation, emergency claiming, dispatching, reporting, map tracking, and chat systems must continue to function exactly as before. [cite: 10]
11. [cite_start]All newly added features must include proper error handling, loading states, validation, reconnection handling, offline handling where applicable, real-time synchronization, and logging for debugging. [cite: 11]

---

## [cite_start]1. Mobile Responder Application [cite: 12]

### [cite_start]1.1 UI/UX Bug Fixes & Full Redesign [cite: 13]

* [cite_start]**Tasks:** Fix all current UI rendering issues, overlapping elements, responsiveness problems, broken layouts, inconsistent spacing, incorrect font scaling, navigation glitches, and theme inconsistencies. [cite: 14]
* [cite_start]**Tasks:** Redesign the responder mobile application UI strictly based on the provided Design_Capstone.pdf. [cite: 14]
* [cite_start]**Implementation Constraints:** Maintain ALL existing backend integrations and business logic. [cite: 14]
* [cite_start]**Implementation Constraints:** DO NOT modify API request structures, socket connection logic, existing authentication flow, existing Redux/Provider state management behavior, or existing emergency workflow logic. [cite: 14]
* [cite_start]**Frontend Scope Only:** The redesign must only replace layouts, colors, typography, buttons, cards, navigation styles, icons, animations, and component styling. [cite: 14, 15]
* [cite_start]**Required UI Improvements:** Responsive support for different Android screen sizes, consistent spacing and padding, improved accessibility and readability, smoother transitions and animations, proper loading indicators, skeleton loaders for API-heavy screens, better error state UI, empty state UI for lists, and improved dark/light mode consistency if currently implemented. [cite: 15]
* [cite_start]**Important:** Existing screen navigation and feature behavior must remain unchanged. [cite: 15]
* [cite_start]**Important:** Existing APIs and data flow must continue to work without backend modification. [cite: 15]

### [cite_start]1.2 Role-Based Emergency Claiming System [cite: 16]

* [cite_start]**Objective:** Restrict responders so they can only view and claim emergencies aligned with their assigned responder role. [cite: 17]
* [cite_start]**Responder Roles:** Medical, Fire, Crime, Rescue, and other future expandable categories. [cite: 17]
* [cite_start]**Requirements:** Responders must only see emergency requests that match their assigned role and must only be able to claim emergencies within their role category. [cite: 17]
* [cite_start]**Requirements:** The filtering must occur both on the frontend UI AND on the backend API validation. [cite: 17]
* [cite_start]**Security Requirement:** Backend validation is mandatory; even if a malicious user bypasses the frontend, the backend must reject invalid claims. [cite: 17]
* [cite_start]**Admin Override Rule:** System Administrators may manually dispatch responders to out-of-role emergencies. [cite: 17]
* [cite_start]**Admin Override Rule:** When manually dispatched, the responder must receive the emergency, may access and respond, and the emergency becomes temporarily valid for that responder. [cite: 18]
* [cite_start]**Database/Logic Requirements:** Preserve current emergency table structure whenever possible, add minimal additional fields only if required, and avoid breaking existing emergency querying logic. [cite: 18]
* [cite_start]**Real-Time Requirements:** Emergency lists must update instantly, and claimed status changes must synchronize in real time. [cite: 18]

### [cite_start]1.3 Native Push Notifications [cite: 19]

* [cite_start]**Objective:** Implement real native push notifications at the device OS level. [cite: 20]
* [cite_start]**Requirements:** Notifications must appear on the lock screen, in the notification tray, while the app is minimized, while the app is backgrounded, and while the app is closed. [cite: 20]
* [cite_start]**Trigger Events:** Admin dispatches responder to emergency, Admin requests additional report, Critical emergency escalation, and Future expandable notification events. [cite: 21, 22]
* [cite_start]**Technical Requirements:** Firebase Cloud Messaging (FCM) should be used if already integrated, preserve existing Firebase configuration, and do not replace working Firebase services. [cite: 22]
* [cite_start]**Notification Features:** Sound support, click action navigation, deep linking to emergency details, notification grouping, and high-priority notifications for emergency dispatches. [cite: 22]
* [cite_start]**Offline Support:** Notifications must still arrive even when the app is not actively running. [cite: 22]
* [cite_start]**Do Not Break:** Existing in-app notifications, existing chat notifications, and existing authentication tokens. [cite: 22]

---

## [cite_start]2. Mobile User Application [cite: 23]

* [cite_start]**Objective:** Upgrade the user application notification system to support native push notifications. [cite: 24]
* [cite_start]**Requirements:** Notifications must function even when the app is closed, backgrounded, or the device is locked. [cite: 24]
* [cite_start]**Notification Triggers:** Emergency accepted, responder dispatched, status updates, emergency resolved, follow-up requests, and admin announcements. [cite: 24]
* [cite_start]**Technical Constraints:** Preserve all current emergency submission logic, API contracts, Firebase integration, and do not modify working emergency request flow. [cite: 24]
* [cite_start]**Additional Requirements:** Notifications should open correct screens, duplication must be prevented, and token refresh handling must be implemented. [cite: 24]

---

## [cite_start]3. Admin Dashboard [cite: 25]

### [cite_start]3.1 Visual & Audio Notification System [cite: 26]

* [cite_start]**Objective:** Implement a comprehensive real-time notification system inside the admin dashboard. [cite: 27]
* [cite_start]**Dashboard Notification Feed:** Real-time notification list, timestamp support, read/unread states, priority indicators, emergency type indicators, and auto-refresh functionality. [cite: 27]
* [cite_start]**Audio Notification Requirements (General):** Play standard notification sound for new logs, reports, status changes, and updates. [cite: 27]
* [cite_start]**Audio Notification Requirements (Critical):** Play aggressive repeating alert sound every 2 seconds, and the loop must continue until the admin acknowledges the emergency. [cite: 27]
* [cite_start]**Audio Notification Requirements (Critical):** Stopping the sound requires the acknowledge button, opening the emergency, or explicit dismissal. [cite: 27]
* [cite_start]**Technical Constraints:** Avoid overlapping sound stacking, prevent multiple duplicated intervals, and ensure browser compatibility. [cite: 27]
* [cite_start]**Real-Time Requirements:** Use existing socket implementation where possible and preserve current dashboard real-time infrastructure. [cite: 27, 28]

### [cite_start]3.2 Real-Time Map Tracking Enhancements [cite: 29]

* [cite_start]**Current State:** Map only displays emergency incident locations. [cite: 30]
* [cite_start]**New Requirements:** Display live locations of all active responders. [cite: 30]
* [cite_start]**New Requirements:** Show different markers for emergency locations, responders, assigned responders, available responders, and off-duty responders. [cite: 30]
* [cite_start]**Location Update Frequency:** Every 3 seconds. [cite: 30]
* [cite_start]**Technical Requirements:** Preserve existing map provider integration, existing OpenStreetMap/map APIs, and avoid unnecessary rerenders. [cite: 30]
* [cite_start]**Performance Requirements:** Optimize marker rendering, prevent memory leaks, and use throttling/debouncing where needed. [cite: 30]
* [cite_start]**Real-Time Sync:** Responder movement must update without manual refresh, and dashboard map updates must synchronize instantly. [cite: 30]
* [cite_start]**Privacy & Status Rules:** Only active/on-duty responders should be visible on dispatcher tracking. [cite: 30]
* [cite_start]**Privacy & Status Rules:** Off-duty responders must disappear or visually change status immediately. [cite: 30, 31]

### [cite_start]3.3 Responder Status Synchronization [cite: 32]

* [cite_start]**Objective:** Fix synchronization issues where off-duty responders incorrectly remain marked as active. [cite: 33]
* [cite_start]**Requirements:** Status changes must synchronize instantly between the mobile responder app, admin dashboard, and map system. [cite: 33]
* [cite_start]**Status Types:** Active, Inactive, Off Duty, Busy, Responding, Unavailable. [cite: 33]
* [cite_start]**Real-Time Requirements:** Updates must occur without page refresh, and socket synchronization must remain stable during reconnects. [cite: 33]
* [cite_start]**Bug Fix Requirements:** Remove stale active states, prevent duplicate online sessions, handle internet reconnection properly, and handle forced logout scenarios. [cite: 33]
* [cite_start]**Map Integration:** Off-duty responders should no longer appear active on the map, and responder marker state must update immediately. [cite: 33]
* [cite_start]**Technical Constraints:** Preserve existing authentication/session logic and do not rewrite current socket architecture unless necessary. [cite: 33]

---

## [cite_start]4. Global Development Constraints [cite: 34]

1. [cite_start]**DO NOT BREAK EXISTING FEATURES:** Existing working features are production-critical, and all currently functioning modules must be preserved. [cite: 35]
2. [cite_start]**DO NOT REMOVE EXISTING CODE WITHOUT ANALYSIS:** If code appears unused, verify all references first. [cite: 36]
3. [cite_start]**BACKWARD COMPATIBILITY IS REQUIRED:** Old mobile app versions should not crash due to backend changes. [cite: 37]
4. [cite_start]**DATABASE SAFETY:** Avoid destructive migrations, do not remove columns/tables, and prefer additive migrations. [cite: 38]
5. [cite_start]**API STABILITY:** Existing response formats and status codes must remain unchanged and compatible. [cite: 39]
6. [cite_start]**SOCKET EVENT STABILITY:** Preserve existing socket event names and payloads. [cite: 40]
7. [cite_start]**TESTING REQUIREMENTS:** Every feature implementation must include functional, real-time, multi-device, offline, reconnection, and notification testing. [cite: 41]
8. [cite_start]**PERFORMANCE REQUIREMENTS:** Avoid unnecessary polling, prevent memory leaks, optimize socket listeners, and optimize map rendering. [cite: 42]
9. [cite_start]**CODE ORGANIZATION:** Keep new code modular, avoid large monolithic files, and reuse existing services where possible. [cite: 43]
10. [cite_start]**DOCUMENTATION:** Comment all major logic additions and document new APIs and socket events. [cite: 44]