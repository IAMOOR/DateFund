# Partner Chat 2.0 — Implementation Plan

## 1. Overview & Goals
Upgrade the **Partner Chat** experience into a rich, interactive relationship hub that connects directly with **Discover & Ekurhuleni Date Spots**, **Date Night Planning**, and **Shared Savings Goals**.

Based on your selections, we will implement:
1. **Share Discover & Map Date Spots into Chat (`spot_share`)**:
   - Add a **"Share to Chat"** action on Discover & Ekurhuleni venue cards (`DiscoverView`) and map venue popovers (`GoogleDateMap`).
   - Render rich venue preview cards in chat showing the venue photo/category, neighborhood (e.g., Benoni, Boksburg, Brakpan, Springs), rating, and estimated budget in Rand (`R`).
   - Include three one-tap actions right on the card:
     - **Vote Thumbs-Up / Down** (synced between both partners)
     - **Add to Date Planner** (opens or creates a planned date event for that spot)
     - **View on Map** (jumps to the interactive map focused on that venue)
2. **Interactive Date Polls & RSVP Voting Cards (`date_poll` & enhanced `date_invite`)**:
   - Allow creating a quick **Date Poll** inside chat (comparing 2–4 date ideas or time slots) where both partners can tap to vote and see live vote tallies.
   - Upgrade **Date Invite (`date_invite`)** cards with interactive RSVP buttons (**"I'm In!"**, **"Maybe / Reschedule"**) so partners can confirm plans in one tap.
3. **Reply-to-Message Quoting & Pinned Couple Reminders**:
   - Add a **Reply** action on any chat bubble that quotes the original message above the composer and links the reply in the timeline.
   - Add a **Pin / Unpin** action on messages along with a collapsible **Pinned Couple Reminder Banner** at the top of the chat header.
4. **Savings Deposit Celebration Cards (`deposit_celebration`) & Read Receipts**:
   - Automatically post (or offer a one-tap share for) a celebratory **Savings Deposit Card** into Partner Chat whenever a partner logs a contribution toward a shared goal, showing the Rand amount contributed and the updated progress bar.
   - Display **Delivered / Seen (`✓✓`)** read receipt indicators on outgoing messages once the partner views the chat.
5. **Date-Grouped Timeline & In-Chat Search**:
   - Group messages cleanly under sticky date dividers (**Today**, **Yesterday**, or formatted date).
   - Add an expandable **Search & Filter bar** in the chat header to quickly search message text, shared spots, polls, or love notes.

---

## 2. Data Model & Firestore Schema Updates
We will extend `PartnerMessage` in `src/types.ts` and `firestore.rules` (remaining backward-compatible with existing messages):
- **New Message Types**:
  - `'spot_share'` — Includes `linkedSpot`: `{ id, name, category, location, province, price, rating, imageUrl, lat?, lng?, votes?: Record<string, 'up' | 'down'> }`
  - `'date_poll'` — Includes `pollData`: `{ question: string, options: Array<{ id: string, label: string, subtitle?: string, votes: string[] }> }`
  - `'deposit_celebration'` — Includes `depositData`: `{ goalId: string, goalTitle: string, amount: number, newCurrentAmount: number, targetAmount: number }`
- **Enhanced Message Fields**:
  - `replyTo?: { messageId: string, senderName: string, previewText: string, type: string }`
  - `isPinned?: boolean`
  - `rsvpStatus?: Record<string, 'going' | 'reschedule'>` (for `date_invite` cards)
  - `readBy?: string[]` (for read receipt `✓✓` status)

---

## 3. UI & Component Changes
1. **`src/types.ts`**:
   - Expand `PartnerMessage` and helper interfaces for `SharedSpotPayload`, `DatePollPayload`, `DepositCelebrationPayload`, and `MessageReplyReference`.
2. **`src/components/views/PartnerChatView.tsx`**:
   - **Header**: Add a search toggle input and a **Pinned Reminder Banner** that highlights pinned messages and scrolls to them when clicked.
   - **Timeline**: Group messages by calendar day (`Today`, `Yesterday`, `10 Nov 2026`) and render quoted reply headers, read receipts (`✓` / `✓✓`), and quick actions (Reply, Pin, React, Delete).
   - **Rich Cards**:
     - `spot_share` card with **Vote Thumbs-Up**, **Add to Date Planner**, and **View on Map** buttons.
     - `date_poll` card with interactive option bars and live partner avatars/checkmarks.
     - `date_invite` card with **"I'm In"** and **"Suggest Time"** RSVP buttons.
     - `deposit_celebration` card with animated progress bar and quick `🥂` celebration reaction.
   - **Composer**: Add a **"Create Date Poll"** modal/drawer trigger and a reply-preview bar when replying to a message.
3. **`src/components/views/DiscoverView.tsx` & `src/components/maps/GoogleDateMap.tsx`**:
   - Add a **"Share to Chat"** button on Discover/Ekurhuleni cards, the Venue Details sheet, and Map popovers that sends a `spot_share` message directly to Partner Chat and optionally opens the chat.
4. **`src/App.tsx` & `firestore.rules`**:
   - Wire up the `onShareSpotToChat`, `onOpenSpotOnMap`, and automatic `deposit_celebration` chat post when a goal deposit is recorded.
   - Update `firestore.rules` so partners can update `votes`, `rsvpStatus`, `readBy`, `isPinned`, and `pollData` on shared messages.
