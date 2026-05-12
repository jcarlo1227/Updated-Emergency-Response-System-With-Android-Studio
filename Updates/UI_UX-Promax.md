# UI UX Pro Max for Codex

Use this file as the project UI and UX instruction set. Apply it whenever you create, edit, review, refactor or improve any interface, component, screen, dashboard, form, table, chart, navigation flow, layout, animation, color system or design token.

## Primary directive

Produce professional, accessible, consistent and responsive interfaces. Every UI change must improve clarity, usability, visual hierarchy and interaction quality without breaking existing functionality.

When the task changes how a feature looks, feels, moves or is interacted with, follow this guide before editing code.

## When to apply

Apply this guide for:

- Web dashboards, admin panels, landing pages, portals and SaaS screens
- Mobile applications and responsive mobile layouts
- Buttons, modals, cards, tables, forms, charts, navigation, sidebars and headers
- Color palettes, typography, spacing, shadows, radius, motion and dark mode
- UI code review, accessibility fixes, visual cleanup and layout refactoring
- Product-level design decisions such as style direction, hierarchy and user flow

Skip this guide for pure backend logic, database work, infrastructure, API-only changes or non-visual scripts unless the task also affects the interface.

## Codex working procedure

Follow this sequence for every UI/UX task.

### 1. Inspect the project first

Before editing, identify the actual stack and structure.

Check for:

- `package.json`
- `pubspec.yaml`
- `tailwind.config.*`
- `vite.config.*`
- `next.config.*`
- `src/`
- `app/`
- `pages/`
- `components/`
- `lib/`
- `assets/`
- `styles/`
- `theme/`

Determine whether the UI is built with React, Next.js, Vue, Svelte, Flutter, React Native, SwiftUI, Tailwind, shadcn/ui, HTML/CSS or another stack.

Do not assume the stack. Use the repository files as the source of truth.

### 2. Understand the feature and user goal

Before coding, identify:

- Product type
- Target user
- Main task the user is trying to complete
- Device context such as desktop, tablet or phone
- Primary action on the screen
- Required data states such as loading, empty, error, success, disabled and offline
- Existing design patterns already used in the project

Every screen must have one clear primary action. Secondary actions must be visually subordinate.

### 3. Preserve existing design language

Reuse existing tokens, components, layout conventions and naming patterns where possible.

Prefer:

- Existing theme variables
- Existing component primitives
- Existing icon family
- Existing spacing scale
- Existing routing and state patterns
- Existing responsive breakpoints

Avoid introducing a separate visual style unless the task explicitly asks for a redesign.

### 4. Create or improve design tokens

When the project lacks a clean design system, add or improve tokens instead of scattering values.

Use semantic tokens for:

- `primary`
- `secondary`
- `accent`
- `surface`
- `background`
- `foreground`
- `muted`
- `border`
- `error`
- `warning`
- `success`
- `info`
- `focus`

Use spacing, radius, shadow, font size and motion tokens where the stack supports them.

Avoid raw per-component hex values unless they are declared in the theme layer.

### 5. Implement the UI change

When coding:

- Keep components small, readable and reusable
- Use semantic HTML on web
- Use native accessible controls in mobile stacks
- Keep state names explicit
- Support keyboard and screen reader behavior
- Support loading, empty, error and success states
- Preserve existing behavior unless asked to change it
- Avoid layout shifts during async loading
- Keep the UI responsive from small phone width to desktop

### 6. Validate before final output

Run available checks when practical.

For web projects, try the commands that exist in `package.json`:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

For Flutter projects, try:

```bash
flutter analyze
flutter test
flutter build apk --debug
```

Use only commands that are appropriate for the project. If a command is unavailable or fails because of missing environment dependencies, report it clearly.

## Priority rules

Follow this order when making tradeoffs.

1. Accessibility
2. Touch and interaction safety
3. Performance and layout stability
4. Style consistency
5. Responsive layout
6. Typography and color readability
7. Motion quality
8. Forms and feedback
9. Navigation clarity
10. Charts and data readability

## Accessibility requirements

Every UI change must meet these requirements.

- Normal text must have at least 4.5:1 contrast
- Large text and major UI glyphs must have at least 3:1 contrast
- Interactive elements must have visible focus states
- Icon-only buttons must have accessible labels
- Forms must use visible labels, not placeholder-only labels
- Keyboard navigation must follow visual order
- Modals must trap focus and provide a clear close action
- Meaningful images must have descriptive alt text or accessibility labels
- Decorative images must be hidden from assistive technology
- Color must never be the only way to communicate status
- Reduced motion preferences must be respected
- Dynamic text size must not break the layout
- Error messages must be announced to screen readers when possible

Never remove focus rings without replacing them with an accessible focus style.

## Touch and interaction requirements

For mobile and touch interfaces:

- Minimum touch target is 44 by 44 pt on iOS and 48 by 48 dp on Android
- Keep at least 8 px or 8 dp spacing between adjacent touch targets
- Do not rely on hover for primary actions
- Provide pressed feedback within 100 ms when possible
- Disable submit buttons during async operations
- Show progress, loading or pending state during async actions
- Keep primary touch targets away from notches, gesture bars and screen edges
- Do not require pixel-perfect taps
- Critical gestures must have visible control alternatives
- Avoid gesture conflicts such as nested horizontal swipes inside vertical scroll regions

## Performance requirements

For web:

- Use optimized images such as WebP or AVIF when available
- Declare image dimensions or aspect ratio to prevent layout shift
- Lazy load below-the-fold images and heavy components
- Split large routes or feature bundles when supported
- Avoid unnecessary third-party scripts
- Avoid layout thrashing and repeated synchronous DOM reads/writes
- Reserve space for async content
- Virtualize long lists with 50 or more visible items when practical
- Keep per-frame UI work below about 16 ms for smooth 60 fps behavior
- Debounce or throttle high-frequency events such as scroll, resize and search input

For mobile:

- Avoid expensive rebuilds in list items
- Use optimized list components
- Keep animations transform-based where possible
- Avoid heavy work on the main thread
- Show offline or degraded network states where relevant

## Visual style rules

Use a consistent style across the product.

Professional default style:

- Clean minimal layout
- Strong hierarchy
- Clear spacing
- Soft but restrained shadows
- Consistent corner radius
- Neutral surface system
- Purposeful accent color
- Accessible contrast
- Vector icons only

Avoid:

- Emoji as structural icons
- Mixed icon families
- Random shadow values
- Random border radius values
- Overuse of gradients
- Low contrast gray text
- Decorative animation without purpose
- Mixing flat, glass, skeuomorphic, neumorphic and brutalist styles without a clear reason
- Overcrowded cards or dashboards
- Hardcoded visual one-offs that do not match the system

## Icons and assets

- Use one icon family per product area
- Prefer Lucide, Heroicons, Material Icons, SF Symbols, Flutter Icons or the existing project icon set
- Use SVG or vector icons where supported
- Do not use emojis for navigation, settings, system controls, emergency types, status indicators or dashboard actions
- Keep icon sizes tokenized such as 16, 20, 24 and 32
- Keep stroke width consistent within the same hierarchy
- Align icons to the text baseline
- Use official brand assets when available
- Do not recolor, distort or crop official logos unless the brand guideline allows it

## Layout and responsive rules

- Design mobile-first, then scale to tablet and desktop
- Do not create horizontal scroll on mobile
- Use consistent breakpoints such as 375, 768, 1024 and 1440 when the project has no existing system
- Body text should be at least 16 px on mobile web
- Keep line length readable: about 35 to 60 characters on mobile and 60 to 75 characters on desktop
- Use a 4 pt or 8 pt spacing rhythm
- Keep fixed headers and bottom bars from covering content
- Use safe-area padding for mobile screens
- Avoid nested scroll regions unless necessary
- Use consistent desktop container widths
- Use whitespace to group related items and separate sections
- Show primary content first on small screens

## Typography rules

- Use a consistent type scale
- Recommended scale: 12, 14, 16, 18, 20, 24, 32, 40 and 48
- Body text line height should usually be 1.5 to 1.75
- Use 600 to 700 weight for headings
- Use 400 for body text
- Use 500 for labels and table headers
- Use tabular numbers for tables, prices, counts, timers and metrics
- Avoid body text smaller than 12 px
- Avoid tight letter spacing on body text
- Prefer wrapping text over truncation
- If truncation is required, provide tooltip, expansion or full detail view where practical

## Color rules

- Use semantic color tokens instead of raw hex values in components
- Test light mode and dark mode separately
- Do not invert light mode colors to create dark mode
- Error, success, warning and info states must include text or icon support, not just color
- Primary text contrast must meet 4.5:1
- Secondary text contrast must meet at least 3:1
- Dividers and borders must remain visible in both light and dark themes
- Disabled states must look disabled and must be semantically disabled

## Animation and motion rules

- Use motion only when it explains state, hierarchy or cause and effect
- Standard micro-interactions should last 150 to 300 ms
- Complex transitions should usually stay under 400 ms
- Avoid animations longer than 500 ms
- Use transform and opacity for animation when possible
- Avoid animating width, height, top or left
- Use ease-out for entering and ease-in for exiting
- Exit animations should be shorter than enter animations
- Make animations interruptible
- Never block user input during an animation
- Respect reduced motion settings
- Do not animate too many elements at once

## Forms and feedback rules

- Every input must have a visible label
- Complex inputs must have helper text
- Required fields must be clearly marked
- Validate on blur or submit, not aggressively on every keystroke
- Show errors near the related field
- Error messages must state what happened and how to fix it
- After submit errors, focus the first invalid field where practical
- Use correct input types such as email, tel, number and password
- Support autofill where possible
- Provide password show/hide toggle when useful
- Use loading, success and error feedback on submit
- Confirm before destructive actions
- Provide undo for destructive or bulk actions where practical
- Long forms should preserve progress or autosave drafts when possible
- Multi-step flows must show progress and allow back navigation
- Avoid overwhelming users with every field at once

## Navigation rules

- Navigation must be predictable and consistent across screens
- Preserve back behavior, scroll position and filter state where practical
- Current navigation state must be visually highlighted
- Bottom navigation should have no more than 5 items
- Bottom navigation is for top-level destinations only
- Use sidebars for desktop or large screens when appropriate
- Use breadcrumbs for web interfaces with 3 or more hierarchy levels
- Do not hide core navigation on deep pages
- Do not use modals for primary navigation flows
- Separate destructive actions like logout and delete account from normal navigation items
- Support deep links or direct URLs for important screens where the stack allows it

## Charts and data visualization rules

- Choose chart type based on the data goal
- Use line charts for trends
- Use bar charts for comparison
- Use donut or pie charts only for simple proportions with 5 or fewer categories
- Use tables for exact values and accessibility
- Always provide labels, legends or direct values
- Do not rely on color alone
- Use accessible colors and sufficient contrast
- Tooltips must be reachable by tap or keyboard where possible
- Use locale-aware number and date formatting
- Show loading, empty and error states for charts
- For large datasets, aggregate or provide drill-down instead of rendering everything
- Provide a text summary of the key insight for screen readers where practical

## Dashboard-specific rules

For admin dashboards and monitoring systems:

- Put the most urgent information above the fold
- Use clear status labels such as pending, responding, resolved, critical and offline
- Use cards only when they group related information
- Use tables for scan-heavy operational data
- Make search, filter and sorting obvious
- Show timestamp and latest update information for live data
- Use empty states that explain what to do next
- Use badges sparingly and consistently
- Keep maps readable and avoid covering markers with panels
- Provide clear escalation, dispatch or action controls
- Avoid dense layouts that require users to inspect every detail before acting

## Emergency system UI rules

For emergency response products such as SafeAlert:

- Prioritize speed, clarity and error prevention over decorative design
- Emergency type buttons must be large, distinct and easy to tap
- Critical actions must have confirmation or clear feedback
- Alert status must be visible and understandable
- Offline state must be explicit
- GPS permission state must be clear
- BLE connection state must be visible when the keychain is involved
- Responder status updates must be simple and fast
- Admin dispatch controls must reduce ambiguity
- Avoid visual clutter during active emergency workflows
- Use calm professional colors, not overly alarming colors everywhere
- Reserve strong danger styling for actual emergency or destructive states

## Stack-specific guidance

### React, Next.js, Vite and Tailwind

- Use semantic HTML elements
- Use component composition
- Use Tailwind utility classes only through a consistent token system
- Use CSS variables or Tailwind theme tokens for colors and spacing
- Avoid hardcoded arbitrary values unless there is a strong reason
- Use `button`, `a`, `input`, `select`, `textarea`, `label` and `table` elements correctly
- Use `aria-label`, `aria-describedby`, `aria-live`, `aria-expanded` and `aria-selected` where appropriate
- Avoid div-only interactive controls
- Use route-level splitting for heavy pages
- Use skeleton states for slow data
- Use accessible dialog and menu components when available

### shadcn/ui

- Prefer shadcn/ui primitives for dialogs, dropdowns, popovers, tabs, sheets, toasts and forms when already installed
- Preserve keyboard behavior from Radix primitives
- Customize through theme tokens, not one-off overrides
- Keep variant names clear such as `default`, `secondary`, `destructive`, `outline`, `ghost` and `link`

### Flutter

- Use Material components when appropriate
- Respect safe areas with `SafeArea`
- Use `Semantics` for custom interactive widgets
- Use `InkWell`, `IconButton`, `ElevatedButton`, `FilledButton`, `OutlinedButton` or equivalent accessible controls
- Avoid gesture-only controls for critical actions
- Keep minimum tap areas at least 48 dp
- Use theme data for colors, typography and component styles
- Avoid hardcoded colors in widgets when a theme token exists
- Use responsive layout with constraints, not only fixed widths
- Use loading, empty, error and offline states
- Run `flutter analyze` after UI edits when practical

### React Native

- Use `Pressable`, `TouchableOpacity` or platform-appropriate controls with accessibility props
- Set `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` and state props where appropriate
- Keep touch targets at least 44 by 44 pt
- Use safe area handling
- Avoid fixed dimensions that break on small screens
- Use FlatList or SectionList for long lists
- Use native-feeling transitions
- Respect reduced motion and font scaling where practical

### HTML and CSS

- Use semantic HTML first
- Use CSS variables for design tokens
- Keep focus styles visible
- Use responsive layout with flexbox or grid
- Avoid fixed pixel layouts that break on mobile
- Use media queries systematically
- Use `prefers-reduced-motion` for motion control
- Use `prefers-color-scheme` only when compatible with the project theme strategy

## Anti-patterns to avoid

Do not introduce these patterns:

- Placeholder-only form labels
- Icon-only buttons without labels
- Emoji used as UI icons
- Low-contrast gray text
- Tiny touch targets
- Hidden focus states
- No loading state for async action
- No error recovery path
- Color-only status meaning
- Random hardcoded colors
- Random spacing and radius values
- Horizontal scroll on mobile
- Content hidden behind sticky headers or bottom bars
- Dashboard cards with too much text and no hierarchy
- Overloaded navigation
- Broken back behavior
- Decorative animation that slows user action
- Large layout shifts when data loads
- Tables with unreadable columns on mobile
- Charts without labels or accessible alternative

## Pre-delivery checklist

Before finishing a UI/UX task, verify:

- The design matches the existing project style
- The screen has a clear primary action
- All interactive controls have accessible names
- All forms have visible labels
- Errors appear near the field and explain how to fix the issue
- Loading, empty, success, error and offline states are handled where relevant
- Text contrast is acceptable in light and dark mode
- Touch targets meet minimum size
- Keyboard navigation works on web
- Focus indicators are visible
- No emojis are used as structural icons
- Icon style is consistent
- Spacing follows a 4 or 8 point rhythm
- Layout works on small mobile, large mobile, tablet and desktop where applicable
- No horizontal scroll appears on mobile
- Fixed headers, tab bars and CTA bars do not cover content
- Animations respect reduced motion
- Charts have labels, legends, tooltips or table alternatives
- Code uses existing tokens and components where possible
- Available lint, typecheck, test or build commands were run when practical

## Final response format for Codex

When reporting completed work, include:

1. Files changed
2. Summary of UI/UX improvements
3. Accessibility improvements
4. Responsive behavior covered
5. Validation commands run and their results
6. Any known limitations or follow-up recommendations

Keep the report concise and factual.

## Default design quality bar

A UI change is acceptable only if it is:

- Clear at first glance
- Usable with keyboard and touch
- Accessible to screen readers where practical
- Responsive across expected screen sizes
- Consistent with the project design system
- Safe for high-pressure workflows
- Stable under loading, empty, error and offline states
- Maintainable by future developers

