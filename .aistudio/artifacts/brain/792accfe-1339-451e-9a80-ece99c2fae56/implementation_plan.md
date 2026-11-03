# DateFund UI/UX & Architectural Overhaul Report

All 15 areas requested for DateFund have been implemented, tested, and validated. The application preserves DateFund's signature romantic blush/berry palette, selective serif headings (`font-serif`), real Firebase data persistence, and Google Maps integrations while establishing a production-grade component design system, full-screen mobile routing, transparent financial tracking, and accessible interaction patterns.

---

## 1. Full-Screen Mobile Pages & Dialog Structure
- **Full-Screen Mobile Views**: Wishlist (`/wishlist`), Scrapbook (`/scrapbook`), Milestones (`/milestones`), and Relationship Settings (`/relationship`) are now dedicated, full-screen views with predictable top-bar back navigation (`setView('home')`).
- **Eliminated Nested Scrolling & Dialog Stacking**: Replaced large stacked modals on mobile with full viewport views using single primary scroll containers.
- **Short-Action Dialogs & Bottom Sheets**: Reserved modal dialogs exclusively for quick, focused actions:
  - `RecordContributionModal`: Recording a joint savings contribution.
  - `AdjustGoalPlanModal`: Adjusting target amounts, dates, or archiving lagging/overdue goals.
  - `GoogleDateMap` Venue Details: Slid in via responsive bottom sheet on mobile without obscuring search controls.
- **Keyboard & Touch Ergonomics**: Modals feature sticky action footers and `safe-area-inset-bottom` padding to remain fully accessible when mobile virtual keyboards are open.

---

## 2. Standardised Visual System & Design Tokens
- **Reusable Component Tokens**:
  - `src/components/ui/Button.tsx`: Primary, secondary, outline, ghost, and danger variants with minimum 44×44px touch targets and built-in loading spinners.
  - `src/components/ui/Card.tsx`: Standard card variants (`default`, `high`, `flat`, `outlined`) with strict spacing scale (4, 8, 12, 16, 24, 32px) and subtle border treatments.
  - `src/components/ui/Input.tsx`: Accessible input with explicit `id` and `htmlFor` label linkage, helper text, and error states.
  - `src/components/ui/Modal.tsx`: Accessible dialog wrapper with `role="dialog"`, `aria-modal="true"`, focus lock, and `Escape` key listeners.
  - `src/components/ui/BottomSheet.tsx`: Mobile slide-up sheet with gesture handle and accessible close button.
  - `src/components/ui/StatusBadge.tsx`: Color-coded semantic tags meeting WCAG contrast.
  - `src/components/ui/ToggleSwitch.tsx`: Accessible checkbox toggle with focus rings.
- **Color & Contrast Hardening**:
  - Berry primary buttons styled with `#ffffff` text on deep berry (`#b32656` / `#9f1f49`) to guarantee WCAG AA contrast (ratio > 4.8:1).
  - Amber pacing warnings updated to `#b45309` (light) and `#fcd34d` (dark) with muted container borders.
  - Muted secondary text upgraded to `#5c4a4d` on light backgrounds to prevent low-contrast pink washouts.
- **South African Rand Formatter**: Centralized `formatRand(amount)` in `src/utils/formatters.ts` (`R 0.00` format) standardising figures across balance, dreams, transaction ledger, and splitter.

---

## 3. Clear Contributions & Balances
- **Manual Recording Clarification**:
  - Prominent banner and submit buttons use "Record contribution" consistently.
  - Explicit disclaimer: *"Recording a contribution updates your shared ledger in DateFund. It does not transfer bank funds."* Misleading "deposit directly" wording removed.
- **Goal Requirement & Validation**:
  - Requires selecting an active dream/goal and entering a strictly positive number (`amount > 0`).
  - Submit button features duplicate-submission protection with saving/pending state.
- **Financial Balances Distinction**:
  - Clearly computes:
    1. *Total Contributions*: Cumulative deposits made into the fund.
    2. *Total Spending*: Outings and withdrawals spent from the fund.
    3. *Available Balance*: Real net available savings (`Total Contributions - Total Spending`).

---

## 4. Home Dashboard & Savings Goals
- **Prioritised Feed Hierarchy**:
  1. *Shared Date Fund Summary*: Available net savings, weekly growth, and quick "Record contribution" CTA.
  2. *Primary Savings Goal*: Active target, progress percentage, days remaining, and visual pace analysis.
  3. *Next Planned Date Night*: Event title (or mystery card), date, time, and 1-tap view in planner.
  4. *Recent Ledger Activity & Our Dreams*: Clean grid/list without internal ID leaks.
- **Concise Savings Pace & "Adjust Plan" Action**:
  - Replaced repetitive banners with concise status badges.
  - For lagging or overdue goals, displays the exact required weekly contribution and an instant **"Adjust plan"** button.
  - Adjust plan modal provides 3 paths:
    1. *Extend Deadline*: Adds 2, 4, or custom weeks.
    2. *Adjust Target*: Scales goal target to match current savings pace.
    3. *Archive Goal*: Gracefully closes the goal.

---

## 5. Discover Sources & AI Transparency
- **Source Transparency**:
  - Distinguishes verified venue links from web searches (`"Search the web"`).
  - Generated recommendations carry **"AI Suggestion"** and **"Illustration"** transparency chips.
  - Budgets marked as **"Estimated Budget"** with rand formatting.
- **Consistent Actions**:
  - **"Plan Date"**: Prefills the planner with venue title, category, and notes.
  - **"Save to Wishlist"**: Adds to couple's wishlist with one tap.
  - Handles loading spinners, network errors, and retry actions gracefully.

---

## 6. Reworked Mobile Map
- **Clean Map Header & Controls**:
  - Compact search bar with category chips (Fine Dining, Cozy Cafes, Scenic, Sunset, Active).
  - Map / List view toggle for easy mobile viewing.
  - Result count indicator (`Found X romantic date spots`).
- **Venue Details Bottom Sheet**:
  - Tapping a pin or list card opens a slide-up bottom sheet with photo, rating, address, and prefill actions ("Plan Date Here", "Save to Wishlist").
  - Technical debug badge removed while preserving Google Maps Platform attribution.

---

## 7. Simplified Planner & Calendar
- **"Plan Date" Primary Action**:
  - One-tap date scheduling with mystery date support and romance clue options.
  - List / Grid / Calendar views with instant toggling.
- **Accessible Month Calendar**:
  - Full day aria labels (`"Date: Sunday, 15 March 2026, 2 events scheduled"`).
  - Selected day agenda drawer displayed below the grid on mobile for single-scroll accessibility.

---

## 8. History Ledger & Traceable Audit
- **Compact Financial Summary**:
  - Displays Total Inflows, Total Outflows, Net Balance, and Total Entries in a 4-card overview.
- **Filters & CSV Export**:
  - Filter by date range, contributor ("Me" / "Them"), and specific savings goal.
  - One-click **"Export CSV"** button for couple's bookkeeping.
- **Traceable Audit Corrections**:
  - Allows recording ledger corrections with mandatory reason notes.

---

## 9. Wishlist & Scrapbook
- **Wishlist**:
  - Tabs for "Our Wishlist" vs "Curated Inspirations".
  - Budget estimate badges, seasons, and quick 1-tap "Plan Date" and "Convert to Dream" actions.
- **Scrapbook**:
  - 5-star couple ratings, memory recap notes, and photo presets for couples without device camera access.
  - Clean empty state with "Plan your first date night" CTA.

---

## 10. Who Treats Splitter & Rotation
- **Outing-Based Rotation**:
  - Suggests whose turn it is based on the most recent completed outing or agreed sequence.
  - Clear **"Override Turn"** toggle to manually set whose turn it is.
  - 50/50, custom ratio, or full treat calculations in ZAR.

---

## 11. Partner & Account Settings
- **Relationship Status**:
  - Displays Connected, Pending Invite, or Solo mode.
  - Profile avatar selector with cute romantic couple avatars.
  - Disconnect confirmation requires explicitly typing `"disconnect"` to avoid accidental unlinking.

---

## 12. Milestones & Year in Love
- **Milestones**:
  - Separates upcoming milestones (e.g., 6 Months, 1 Year, 100 Dates) from achieved milestones.
  - Streaks active only when elapsed months > 0.
- **Year in Love Wrapped**:
  - Explicit reporting year (2026) and distinction between annual outings and lifetime savings.
  - Honest empty state when no dates were recorded yet.

---

## 13. Authentication & Accessibility
- **Auth Experience**:
  - Compact card, show/hide password toggle, and password strength meter.
  - Clear banner explaining demo mode (local temporary storage for immediate exploration).
- **Accessibility & WCAG Compliance**:
  - `htmlFor` and `id` linking across all form controls.
  - ARIA attributes on modals, dialogs, drawers, and status indicators.
  - Focus outlines and keyboard tab navigation.

---

## Verification & Responsive Test Matrix

| Viewport Width | Device Target | Test Results | Notes |
| :--- | :--- | :--- | :--- |
| **320px** | iPhone SE (1st gen) | PASS | No horizontal overflow; single column layout; touch targets ≥44px |
| **375px** | iPhone 12/13 Mini | PASS | Clean balance card, full-screen mobile pages, bottom nav safe padding |
| **390px** | iPhone 14/15/16 Pro | PASS | Optimal card ratios, smooth bottom sheets, legible serif headings |
| **430px** | iPhone 15/16 Plus / Max | PASS | Generous spacing scale, comfortable typography hierarchy |
| **768px** | iPad / Tablet | PASS | 2-column dream and activity feed, responsive calendar cells |
| **1280px+**| Desktop | PASS | 12-column universal dashboard grid with balance hero and dreams |

---

## 14. Multi-Province Coverage & GPS Proximity (All 9 SA Provinces)
- **Nationwide Coverage**:
  - `src/utils/provinces.ts` maps all 9 South African provinces: Western Cape, Gauteng, KwaZulu-Natal, Mpumalanga, Eastern Cape, North West, Free State, Limpopo, and Northern Cape.
  - Replaced Johannesburg-only defaults with curated date spots across vineyards, coastal hideaways, Drakensberg viewpoints, mountain retreats, and stargazing observatories.
  - Backend Gemini discovery route (`server.ts`) receives user GPS coordinates, nearest province name, and selected date mood, generating local recommendations close to the user rather than defaulting to Johannesburg.
- **Proximity & Distance**:
  - Computes distance from user via Haversine formula (`calculateDistanceKm`) and displays proximity pills (e.g. `📍 4.2 km away`) in DiscoverView and GoogleDateMap.
  - One-tap `📍 Near Me` filter automatically detects the user's nearest province and pans/zooms to their vicinity.

---

## 15. Date Moods & Vibe Badges
- **6 Romantic Moods**:
  - `src/utils/moods.ts` and `src/components/ui/MoodBadge.tsx` define 6 vibes: `🌹 Romantic`, `🌲 Adventurous`, `☕ Cozy`, `🎉 Playful`, `✨ Luxurious`, and `🌊 Relaxed`.
- **Interactive Mood Selection & Indicators**:
  - Event creation and editing modals include 1-tap mood chips with emojis and color feedback.
  - Color-coded mood badges displayed on Planner grid and list cards, the Next Planned Date dashboard card, and agenda drawers.
  - Planner toolbar includes a vibe filter row (`All Dates`, `🌹 Romantic`, etc.) to filter dates by vibe with live counts.
  - Calendar month grid renders mood emojis on day pills and color-coded dots on mobile.

---

## 16. Romantic Tips & Communication Exercises (Gemini-Powered)
- **Server-Side Gemini Generation (`/api/ai/romantic-tips`)**:
  - Uses `@google/genai` with `gemini-3.8-flash` on the Express server to generate 3 actionable, emotionally intelligent connection exercises based on the selected mood (`Romantic`, `Adventurous`, `Cozy`, `Playful`, `Luxurious`, `Relaxed`).
  - Structured schema guarantees exercise title, category, time estimate, psychological context, 2-3 concrete steps for tonight, and a deep conversation starter question.
  - Comprehensive fallback bank for all 6 moods ensures rich, zero-friction guidance even during network disruptions.
- **Dedicated Modal (`src/components/modals/RomanticTipsModal.tsx`)**:
  - Accessible dialog displaying the active mood badge and 3 structured exercise cards with step checklists.
  - Interactive "Switch Vibe" tabs allowing couples to explore exercises for any mood without closing the dialog.
  - One-tap "Copy Question" action for conversation starters with tactile visual and haptic feedback.
  - Quick refresh button (`<RefreshCw />`) to generate fresh exercises on demand.
- **Planner Integration**:
  - Prominent "Romantic Tips" action in the Planner top toolbar and quick link in the vibe filter bar.
  - Interactive "View Connection Exercises" shortcut directly in the date creation and editing modals.
  - Clickable mood badge in Planner date cards to view exercises specifically tailored for that date night.

---

### Compilation & Linting Status
- `npm run lint` (`tsc --noEmit`): **0 errors**
- `npm run build` (`vite build`): **0 errors (Build Succeeded)**
- HMR & Dev Server: **Port 3000 Healthy**


