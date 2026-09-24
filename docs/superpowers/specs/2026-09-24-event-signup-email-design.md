# Email event signups — design

**Date:** 2026-09-24
**Status:** Approved

## Context

Officers can see who signed up for each timeslot on the Events page but have no
way to message them. This adds a per-event "Email signups" page where an officer
picks a subset of signups and sends them one message.

## Decisions

1. **Picker:** checkbox list grouped by timeslot, all checked by default, with
   quick-select buttons (All / None / Confirmed only / Waitlist only) and a
   per-slot Select all / Clear.
2. **Delivery:** BCC in chunks of 80 from the chapter Gmail, branded layout,
   subject prefixed "Tri-M Hours - ", body HTML-escaped with line breaks kept,
   footer "Sent by {officer}". `Reply-To` is the officer's email.
3. **Recipients:** de-duplicated by user; only verified, active accounts. If any
   submitted signup id is not part of the event, the whole request is rejected.
4. **Synchronous send** in the server action so the flash reports the real
   outcome (sent / unconfigured / failed). Audit action `event.email`.
5. Out of scope: rate limiting, drafts, scheduling, CC-self, attachments.

## Design

- `src/lib/services/event-email-service.ts`: `getEventForEmail`, `resolveEmailRecipients`.
- `src/lib/email/templates.ts`: `eventSignupEmail` (+ private `escapeHtml`).
- `src/lib/email/notify.ts`: `emailEventSignups` (not wrapped in `safeSend`).
- `src/lib/email/mailer.ts`: `replyTo` passthrough.
- `src/actions/event-email.ts`: `emailSignupsAction`.
- `src/app/officer/events/[id]/email/page.tsx` + `src/components/forms/RecipientPicker.tsx`.
- Link on `/officer/events` rows that have signups.
