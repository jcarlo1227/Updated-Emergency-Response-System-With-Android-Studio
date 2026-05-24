SafeAlert System – Detailed Revision Requirements & Development Constraints

This document contains the revised and expanded feature requirements, bug fixes, implementation rules,
and development constraints for the SafeAlert Emergency Response System.

IMPORTANT DEVELOPMENT RULES:
1. Existing working backend logic, APIs, authentication, database structures, routing, and socket events MUST NOT be removed, rewritten, or modified unless explicitly required for the new feature.
2. Any new feature implementation must be backward compatible with all currently working modules.
3. Existing working functionalities must remain operational after implementation.
4. Refactoring existing code is NOT allowed unless:
   - The current implementation causes a bug,
   - The current implementation prevents the new feature from working,
   - Or the change is explicitly requested in this document.
5. All changes must be additive and isolated whenever possible.
6. Before editing any existing function, controller, API route, service, provider, socket event, or database query:
   - Verify whether it is currently used by another module.
   - Preserve the original behavior.
   - Maintain response formats and payload structures.
7. DO NOT rename:
   - Existing API endpoints,
   - Existing database columns,
   - Existing socket event names,
   - Existing authentication logic,
   - Existing Firebase configuration,
   - Existing Redux/Context state names,
   - Existing provider/service class names,
   unless absolutely necessary.
8. UI redesign tasks must ONLY affect frontend presentation and styling unless functionality fixes are explicitly required.
9. Existing login, registration, emergency creation, emergency claiming, dispatching, reporting, map tracking, and chat systems must continue to function exactly as before.
10. All newly added features must include:
   - Proper error handling,
   - Loading states,
   - Validation,
   - Reconnection handling,
   - Offline handling where applicable,
   - Real-time synchronization,
   - Logging for debugging.

1. Mobile Responder Application
1.1 UI/UX Bug Fixes & Full Redesign

Tasks:
• Fix all current UI rendering issues, overlapping elements, responsiveness problems, broken layouts,
  inconsistent spacing, incorrect font scaling, navigation glitches, and theme inconsistencies.

• Redesign the responder mobile application UI strictly based on the provided Design_Capstone.pdf.

Implementation Constraints:
• Maintain ALL existing backend integrations and business logic.
• DO NOT modify:
  - API request structures,
  - Socket connection logic,
  - Existing authentication flow,
  - Existing Redux/Provider state management behavior,
  - Existing emergency workflow logic.

Frontend Scope Only:
• The redesign must only replace:
  - Layouts,
  - Colors,
  - Typography,
  - Buttons,
  - Cards,
  - Navigation styles,
  - Icons,
  - Animations,
  - Component styling.

Required UI Improvements:
• Responsive support for different Android screen sizes.
• Consistent spacing and padding.
• Improved accessibility and readability.
• Smoother transitions and animations.
• Proper loading indicators.
• Skeleton loaders for API-heavy screens.
• Better error state UI.
• Empty state UI for lists.
• Improved dark/light mode consistency if currently implemented.

Important:
• Existing screen navigation and feature behavior must remain unchanged.
• Existing APIs and data flow must continue to work without backend modification.

1.2 Role-Based Emergency Claiming System

Objective:
Restrict responders so they can only view and claim emergencies aligned with their assigned responder role.

Responder Roles:
• Medical
• Fire
• Crime
• Rescue
• Other future expandable categories

Requirements:
• Responders must only see emergency requests that match their assigned role.
• Responders must only be able to claim emergencies within their role category.
• The filtering must occur both:
  - On the frontend UI,
  - AND on the backend API validation.

Security Requirement:
• Backend validation is mandatory.
• Even if a malicious user bypasses the frontend, the backend must reject invalid claims.

Admin Override Rule:
• System Administrators may manually dispatch responders to out-of-role emergencies.
• When manually dispatched:
  - The responder must receive the emergency,
  - The responder may access and respond,
  - The emergency becomes temporarily valid for that responder.

Database/Logic Requirements:
• Preserve current emergency table structure whenever possible.
• Add minimal additional fields only if required.
• Avoid breaking existing emergency querying logic.

Real-Time Requirements:
• Emergency lists must update instantly.
• Claimed status changes must synchronize in real time.

1.3 Native Push Notifications

Objective:
Implement real native push notifications at the device OS level.

Requirements:
Notifications must appear:
• On lock screen,
• In notification tray,
• While app is minimized,
• While app is backgrounded,
• While app is closed.

Trigger Events:
1. Admin dispatches responder to emergency.
2. Admin requests additional report.
3. Critical emergency escalation.
4. Future expandable notification events.

Technical Requirements:
• Firebase Cloud Messaging (FCM) should be used if already integrated.
• Preserve existing Firebase configuration.
• Do not replace working Firebase services.

Notification Features:
• Sound support.
• Click action navigation.
• Deep linking to emergency details.
• Notification grouping.
• High-priority notifications for emergency dispatches.

Offline Support:
• Notifications must still arrive even when the app is not actively running.

Do Not Break:
• Existing in-app notifications.
• Existing chat notifications.
• Existing authentication tokens.

2. Mobile User Application

Objective:
Upgrade the user application notification system to support native push notifications.

Requirements:
• Notifications must function even when:
  - App is closed,
  - App is backgrounded,
  - Device is locked.

Notification Triggers:
• Emergency accepted.
• Responder dispatched.
• Status updates.
• Emergency resolved.
• Follow-up requests.
• Admin announcements.

Technical Constraints:
• Preserve all current emergency submission logic.
• Preserve existing API contracts.
• Preserve existing Firebase integration.
• Do not modify working emergency request flow.

Additional Requirements:
• Notifications should open correct screens.
• Notification duplication must be prevented.
• Token refresh handling must be implemented.

3. Admin Dashboard
3.1 Visual & Audio Notification System

Objective:
Implement a comprehensive real-time notification system inside the admin dashboard.

Dashboard Notification Feed:
• Real-time notification list.
• Timestamp support.
• Read/unread states.
• Priority indicators.
• Emergency type indicators.
• Auto-refresh functionality.

Audio Notification Requirements:
General Notifications:
• Play standard notification sound for:
  - New logs,
  - Reports,
  - Status changes,
  - Updates.

Critical Emergency Alerts:
• Play aggressive repeating alert sound every 2 seconds.
• Loop must continue until admin acknowledges the emergency.
• Stopping the sound requires:
  - Acknowledge button,
  - Open emergency,
  - Or explicit dismissal.

Technical Constraints:
• Avoid overlapping sound stacking.
• Prevent multiple duplicated intervals.
• Ensure browser compatibility.

Real-Time Requirements:
• Use existing socket implementation where possible.
• Preserve current dashboard real-time infrastructure.

3.2 Real-Time Map Tracking Enhancements

Current State:
Map only displays emergency incident locations.

New Requirements:
• Display live locations of all active responders.
• Show different markers for:
  - Emergency locations,
  - Responders,
  - Assigned responders,
  - Available responders,
  - Off-duty responders.

Location Update Frequency:
• Every 3 seconds.

Technical Requirements:
• Preserve existing map provider integration.
• Preserve existing OpenStreetMap/map APIs.
• Avoid unnecessary rerenders.

Performance Requirements:
• Optimize marker rendering.
• Prevent memory leaks.
• Use throttling/debouncing where needed.

Real-Time Sync:
• Responder movement must update without manual refresh.
• Dashboard map updates must synchronize instantly.

Privacy & Status Rules:
• Only active/on-duty responders should be visible on dispatcher tracking.
• Off-duty responders must disappear or visually change status immediately.

3.3 Responder Status Synchronization

Objective:
Fix synchronization issues where off-duty responders incorrectly remain marked as active.

Requirements:
• Status changes must synchronize instantly between:
  - Mobile responder app,
  - Admin dashboard,
  - Map system.

Status Types:
• Active
• Inactive
• Off Duty
• Busy
• Responding
• Unavailable

Real-Time Requirements:
• Updates must occur without page refresh.
• Socket synchronization must remain stable during reconnects.

Bug Fix Requirements:
• Remove stale active states.
• Prevent duplicate online sessions.
• Handle internet reconnection properly.
• Handle forced logout scenarios.

Map Integration:
• Off-duty responders should no longer appear active on the map.
• Responder marker state must update immediately.

Technical Constraints:
• Preserve existing authentication/session logic.
• Do not rewrite current socket architecture unless necessary.

4. Global Development Constraints

STRICT RULES FOR ALL DEVELOPMENT TASKS:

1. DO NOT BREAK EXISTING FEATURES
• Existing working features are production-critical.
• Preserve all currently functioning modules.

2. DO NOT REMOVE EXISTING CODE WITHOUT ANALYSIS
• If code appears unused, verify all references first.

3. BACKWARD COMPATIBILITY IS REQUIRED
• Old mobile app versions should not crash due to backend changes.

4. DATABASE SAFETY
• Avoid destructive migrations.
• Do not remove columns/tables.
• Prefer additive migrations.

5. API STABILITY
• Existing response formats must remain unchanged.
• Existing status codes must remain compatible.

6. SOCKET EVENT STABILITY
• Preserve existing socket event names and payloads.

7. TESTING REQUIREMENTS
Every feature implementation must include:
• Functional testing,
• Real-time testing,
• Multi-device testing,
• Offline testing,
• Reconnection testing,
• Notification testing.

8. PERFORMANCE REQUIREMENTS
• Avoid unnecessary polling.
• Prevent memory leaks.
• Optimize socket listeners.
• Optimize map rendering.

9. CODE ORGANIZATION
• Keep new code modular.
• Avoid large monolithic files.
• Reuse existing services where possible.

10. DOCUMENTATION
• Comment all major logic additions.
• Document new APIs and socket events.
