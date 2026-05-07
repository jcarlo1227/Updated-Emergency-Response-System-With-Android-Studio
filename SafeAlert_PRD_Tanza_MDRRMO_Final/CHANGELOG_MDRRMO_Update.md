# MDRRMO and Tanza Scope Update Changelog

## Applied user clarifications

- Updated ambulance capacity from 12 daily booking slots to 12 physical ambulance units.
- Updated Schedule and Transfer logic so requests can overlap when different physical ambulance units are available.
- Updated reservation logic so ambulance capacity is reserved only after admin approval and assignment.
- Updated Emergency ambulance requests so they still require admin approval, but are pinned, highlighted and treated as critical priority.
- Updated proof of indigency as required for ambulance transport requests.
- Added Tanza citizen or resident priority fields and admin badges.
- Added a dedicated PRD for the IoT keychain device and BLE emergency keychain integration.

## Files changed

- PRD 01 - Backend and API Security Layer.
- PRD 02 - User Mobile App Flutter.
- PRD 03 - Responder Mobile App Flutter.
- PRD 04 - Admin Command Center React.
- PRD 05 - Cross Cutting Security and Privacy.
- PRD 06 - Code and Logic Checking.
- PRD 07 - Publish Readiness and Release Checklist.
- PRD 08 - MDRRMO Ambulance Transport Form.
- PRD 09 - IoT Keychain Device and BLE Emergency Keychain Integration.
- README PRD Index.

## Recommended decisions still needed

1. Confirm the estimated duration logic for Schedule and Transfer requests. The system needs this to know when a physical ambulance becomes available again.
2. Confirm whether non Tanza users are allowed but lower priority, or rejected unless admin overrides.
3. Confirm whether Emergency requests should trigger an admin sound alert, SMS fallback or both.
4. Confirm whether outside Tanza alerts are blocked at submission or submitted with admin review only.
5. Confirm if the User mobile app should allow a short cancel window after keychain button click.


## Final discussion update

- Added app wide scope limitation to Tanza Municipality, Cavite.
- Added Tanza default map extent, barangay based filters, scope flags and outside Tanza admin review handling.
- Corrected IoT keychain hardware specification to 4 buttons, 1 switch and 1 LED.
- Removed long press, double press, triple press and sequence based panic rules.
- Updated keychain event flow to Keychain Button Press -> User Mobile App -> Backend -> Admin Dashboard -> OpenStreetMap.
- Clarified that the keychain sends only BLE trigger data.
- Added User mobile app responsibility to attach type of accident, full name, age, face, phone GPS, blood type and emergency contact person.
- Added Admin Dashboard OpenStreetMap marker behavior, including clickable marker detail drawer.
