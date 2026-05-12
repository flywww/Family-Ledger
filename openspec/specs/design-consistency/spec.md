## Purpose
Define enforceable Family Ledger design consistency requirements for tokenized surfaces, mobile-safe forms, accessible feedback, navigation states, data legibility, and responsive verification.

## Requirements

### Requirement: Tokenized Visual Consistency
The system SHALL resolve documented visual conflicts by using the Family Ledger design system and existing shadcn/Tailwind token model as the default source of truth.

#### Scenario: Login uses tokenized surfaces
- **WHEN** the unauthenticated login page is rendered
- **THEN** its page background and card treatment use token-backed classes instead of one-off hard-coded gradients

#### Scenario: Status panels use documented status vocabulary
- **WHEN** monthly refresh, cron health, or cron test status content is rendered
- **THEN** status colors use the documented success, warning, info, and failure vocabulary and include text labels that do not rely on color alone

#### Scenario: Accepted visual decisions remain documented
- **WHEN** an existing conflict is intentionally preserved, such as card radius, system typography, or five chart tokens
- **THEN** the decision is documented in the design consistency backlog or design system rather than silently diverging

### Requirement: Mobile-Safe Forms
The system SHALL avoid fixed-width form controls that can overflow a 375px viewport.

#### Scenario: Balance form controls fit mobile viewport
- **WHEN** balance create, balance edit, holding create, or password-change forms are viewed at 375px width
- **THEN** inputs, selects, popover triggers, textareas, and submit controls fit inside the viewport without horizontal scrolling

#### Scenario: Desktop form density is preserved
- **WHEN** the same forms are viewed at 768px width or wider
- **THEN** controls retain a constrained readable width comparable to the current desktop form layout

### Requirement: Consistent Feedback And Announcements
The system SHALL provide consistent visible and accessible feedback for validation, async submission, and operational status changes.

#### Scenario: Form submission has visible state
- **WHEN** a user submits login, balance create, balance edit, holding create, password-change, or inline balance edit forms
- **THEN** the UI shows pending state and either success, redirect, or error feedback appropriate to the action

#### Scenario: Async errors are announced
- **WHEN** an async error message becomes visible after form or operational action failure
- **THEN** the message is exposed through `role="alert"` or an assertive live region

#### Scenario: Non-error status updates are announced politely
- **WHEN** non-error status, progress, or success messages update dynamically
- **THEN** the message is exposed through a polite live region or equivalent accessible status pattern

### Requirement: Navigation And Action Discoverability
The system SHALL provide visible interaction states and mobile access to primary balance creation actions.

#### Scenario: Navigation has visible interactive states
- **WHEN** a user hovers, focuses, or lands on an active authenticated navigation link
- **THEN** the link has a visible text or background state using tokenized classes rather than opacity-only feedback

#### Scenario: Mobile users can create a balance
- **WHEN** the balance toolbar is viewed on mobile
- **THEN** the user can reach the `New balance` action without relying on a desktop-only menu

### Requirement: Data Text Remains Legible
The system SHALL keep financial data text legible against the surfaces where it appears.

#### Scenario: Percentage text has contrast
- **WHEN** balance percentage values are displayed for asset or non-liability rows
- **THEN** the text uses a foreground or semantic token that maintains readable contrast on the row background

#### Scenario: Demo credentials render as UI text
- **WHEN** demo credentials are shown on the login form
- **THEN** the credentials render as plain UI text or inline code elements, not literal Markdown-style backtick text

### Requirement: Responsive And Visual Verification
The system SHALL be verifiable against the documented responsive and design-system expectations.

#### Scenario: Required breakpoints are checked
- **WHEN** the design consistency change is implemented
- **THEN** the affected login, dashboard, balance, settings, and form surfaces are checked at 375px, 768px, 1024px, and 1440px where applicable

#### Scenario: Charts preserve token color source
- **WHEN** dashboard charts render more categories than available chart tokens
- **THEN** colors continue to come from `--chart-1` through `--chart-5` and labels/tooltips identify categories clearly
