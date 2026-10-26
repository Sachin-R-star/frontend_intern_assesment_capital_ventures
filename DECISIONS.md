# Architecture & Engineering Decisions (`DECISIONS.md`)

This document captures the architectural rationale, security analyses, problem trade-offs, and handling of tricky edge cases for the **Freeflow Ventures Support Ticket Dashboard**.

---

## 1. Unclear, Clashing, or Unsafe Points in the Brief

The brief intentionally contained ambiguities, contradictions, and security risks. Here is what was identified and the decisions taken:

### 1.1 Unsafe: Stored Cross-Site Scripting (XSS) via Customer Input
- **The Brief:** Page 3 stated: *"Show the body exactly as the customer wrote it, including any HTML formatting they used."* Test ticket `T-2002` provided: `<img src=x onerror="alert('hacked')"> I was charged twice. <a href="https://example.com/invoice">Invoice</a>`. Test ticket `T-2011` also included an `onerror` alert inside the AI summary!
- **The Danger:** Directly rendering raw HTML with `dangerouslySetInnerHTML` allows arbitrary JavaScript execution in the support agent's browser session. An attacker could exfiltrate cookies, token credentials, or trigger unauthorized support actions.
- **Decision:** Implemented client-side and server-safe HTML sanitization using `DOMPurify` via a dedicated `<SafeHtml />` component. We whitelist legitimate formatting tags (`<b>`, `<i>`, `<p>`, `<a>`, `<code>`, `<ul>`, etc.) and safe attributes (`href`, `title`, `target`, `rel`), while aggressively stripping active script vectors, event handlers (`onerror`, `onload`), and dangerous schemes (`javascript:`).

### 1.2 Unsafe: Malicious Protocol in Attachment URL
- **The Brief:** Test ticket `T-2003` included: `attachment_url: "javascript:alert(document.cookie)"`.
- **The Danger:** Rendering `<a href={ticket.attachment_url}>` triggers inline script execution when clicked by an agent.
- **Decision:** Built `validateAttachmentUrl` in `src/lib/utils/sanitize.ts`. Any attachment URL starting with `javascript:`, `data:`, `vbscript:`, or non-HTTP/HTTPS schemes is blocked. The UI displays an explicit security warning badge: *"Dangerous link protocol blocked for security"* and neutralizes the link.

### 1.3 Unsafe & Clashing: Leaking Secrets via `NEXT_PUBLIC_TRIAGE_API_KEY`
- **The Brief:** Page 4 instructed: *"To keep things simple, call the AI service straight from the browser, using the key in NEXT_PUBLIC_TRIAGE_API_KEY."* Yet Page 3 noted that the AI service requires a secret `TRIAGE_API_KEY`, and Page 9 reiterated: *"keeping secrets out of the browser"*.
- **The Conflict:** Next.js exposes any environment variable prefixed with `NEXT_PUBLIC_` directly in browser JavaScript bundles. Exposing third-party or internal AI credentials to client inspect tools is an operational security vulnerability.
- **Decision:** The browser never calls external AI endpoints directly with a secret key. Instead, the frontend invokes our internal backend route `POST /api/tickets/:id/retriage`. The route handler securely loads `process.env.TRIAGE_API_KEY` server-side, protecting internal credentials.

### 1.4 Clash: Pagination vs. "Dislike Clicking Next Page"
- **The Brief:** Page 2 requested: `GET /api/tickets` *"split into pages"*. Page 3 stated: *"Agents dislike clicking 'next page'. Show all tickets on one page, so they can just scroll."*
- **The Conflict:** Transferring all ~2,000+ tickets in a single giant payload degrades network performance, causes main-thread JSON parsing lag, and slows Time-to-Interactive.
- **Decision:** Kept paginated slicing on the server (`page` and `limit` query parameters, default 30 per chunk), and implemented **continuous infinite scrolling** on the frontend using `IntersectionObserver`. As the agent scrolls down, the next page is fetched and appended seamlessly without pagination clicks.

### 1.5 Clash: Redux Filter State vs. URL Link Sharing & Refresh
- **The Brief:** Page 3 stated: *"Filters must stay after a page refresh, and agents must be able to share a filtered view as a link. Keep the active filters in Redux, so any component can read them."*
- **The Conflict:** In-memory Redux store state resets on page reloads and cannot be shared across browsers by URL.
- **Decision:** Implemented **bi-directional synchronization**:
  1. The URL query string (`?status=open&priority=P0&search=...`) acts as the single persistent source of truth for sharable state.
  2. On initial mount and browser back/forward navigation (`popstate`), Redux initializes and updates from URL search params.
  3. When an agent changes a filter in Redux, a debounced sync updates the browser URL without full-page reloads (`router.replace(..., { scroll: false })`).

### 1.6 Ambiguity: Status Workflow with `closed` Tickets
- **The Brief:** The allowed next steps were specified as: `open -> in_progress -> resolved` and `resolved -> open`. However, test ticket `T-2010` has `status: "closed"`.
- **Decision:** In standard ITIL support workflows, `closed` represents an archived resolved ticket. We added an explicit transition: `closed -> open` (allowing agents to reopen closed tickets if the customer returns), and prevented illegal transitions like jumping directly from `open -> resolved` or `in_progress -> open`.

---

## 2. Test Ticket Handling & Edge Case Solutions

Each of the 12 test tickets in the assignment had a deliberate challenge:

| Ticket ID | Special Trait / Trap | How the App Handles It & Why |
|---|---|---|
| **T-2001** | Appears twice in the PDF test data with duplicate `external_id` | Assigned distinct internal unique IDs (`test-1`, `test-2`) while retaining external ID metadata, preventing React key conflicts and ensuring stable DOM reconciliation. |
| **T-2002** | Stored XSS in customer body (`<img onerror="...">`) and HTML in subject (`<b>Refund</b>`) | `SafeHtml` with `DOMPurify` purges the `onerror` attack while rendering valid formatting and safe links. Subject text is rendered as safe text to prevent tag injection in table cells. |
| **T-2003** | Prompt injection in body + `javascript:alert()` in `attachment_url` + flagged by AI | Sanitized URL validator blocks the malicious scheme and shows a security warning badge. AI flagged input reason is displayed prominently. |
| **T-2004** | Invalid customer plan (`platinum`), invalid priority (`P5`), null summary | Priority badge falls back to a purple warning badge for non-standard priorities; SLA calculation defaults safely to P3 duration rather than crashing with `NaN`. |
| **T-2005** | Very long subject (>100 characters without spaces) | Table cell applies CSS text truncation with a tooltip and `break-words` on the detail view to prevent layout blowout. |
| **T-2006** | Empty subject `""` and `body: null`, `summary: null` | UI gracefully falls back to italicized placeholders `(No subject)` and `(The customer did not provide a message body.)` without UI collapse. |
| **T-2007** | Arabic RTL text (`"لا أستطيع..."`) + non-standard date format (`"2026-09-20 11:30:00"`) + enterprise rule priority divergence | `dir="auto"` automatically renders Arabic RTL. Custom date parser normalizes space-separated dates into valid UTC ISO format. A badge highlights that AI suggested P3, but the Enterprise rule enforced P1. |
| **T-2008** | Future timestamp (`"2027-01-01T00:00:00Z"`) | SLA calculation detects future creation time; displays `Scheduled (Future)` without negative or corrupted countdown timers. |
| **T-2009** | Unknown agent (`agent-99`) + non-standard timezone offset (`+05:30`) | Parsed via JavaScript `Date` constructor which supports standard ISO timezone offsets; assigned agent renders cleanly as `agent-99`. |
| **T-2010** | Status is `closed` + valid image attachment link | Handled as a terminal status badge; allows reopening to `open`. Safe attachment URL opens securely in a new tab with `target="_blank" rel="noopener noreferrer"`. |
| **T-2011** | Stored XSS inside AI generated summary (`<img src=x onerror="alert('summary')">`) | Validates that **AI output cannot be blindly trusted**. The summary is sanitized through `SafeHtml` before rendering. |
| **T-2012** | Unknown triage decision (`triage_decision: "maybe"`) | Fallback routing: any decision other than `auto_accept` is treated as requiring human verification so it is never dropped silently. |

---

## 3. Data Architecture: Where Data Lives and Why

| Data | Location | Rationale |
|---|---|---|
| **Active Filters & Search Query** | **URL Search Params + Redux** | The URL ensures links are shareable with coworkers and survive browser refresh. Redux provides instant reactive access to header and child components without prop drilling. |
| **Current Active Agent** | **Redux + `localStorage`** | Agents do not log in via full auth, so local storage preserves identity across page reloads. Synchronized to Redux for global reactivity. |
| **Header Badge Counters (`My tickets`, `To review`)** | **Redux (`statsSlice`)** | The header needs immediate reactive updates when an agent claims a ticket, when background polling completes, or when an agent overrides triage. |
| **Ticket Records & In-memory Store** | **Server Memory (`globalThis`)** | Data is held in an in-memory singleton store on the server. Business rules (transitions, enterprise constraints, race conflicts) are enforced authoritatively on the server. |
| **Form Inputs & Double-click Locks** | **Local Component State (`useState`)** | Transient draft inputs (e.g., triage override reason, pending button disable states) belong inside local component state to prevent unnecessary store thrashing. |

---

## 4. How Live Updates Work

- **Polling Frequency:** The client polls `GET /api/tickets/updates?since=<timestamp>` every **7 seconds**.
- **Why 7 Seconds?**
  1. The server simulation produces a background event every 5 to 10 seconds. Polling every 7 seconds hits the sweet spot between capturing changes within a reasonable time window and avoiding excessive HTTP request overhead.
  2. WebSockets or Server-Sent Events (SSE) would be ideal for production, but within an in-memory serverless Next.js route handler environment, timestamp-delta polling is robust, lightweight, and resilient to reconnections.
- **Preventing Content Jumps:**
  When polling detects newly created tickets while an agent is reading or scrolling, it does **not** insert them directly into the active list. Instead, tickets are staged in `pendingNewTickets` in Redux, and an interactive banner appears: *"3 new tickets arrived — click to show"*. Clicking it prepends them smoothly.

---

## 5. Trusting AI Output

**We treat AI output as fundamentally untrusted user-generated content.**
1. **Security:** As demonstrated by test ticket `T-2011`, AI output can contain malicious XSS payload injections (e.g. from prompt reflection or model vulnerabilities). AI summaries are always sanitized with `DOMPurify`.
2. **Business Constraints:** As demonstrated by test ticket `T-2007`, the AI model suggested priority `P3` for an Enterprise customer whose contract guarantees at least `P1`. The business rule layer strictly overrides AI output before persistence.
3. **Classification Confidence:** Tickets flagged for `manual_review` are quarantined in the `/review` queue and cannot bypass human review until explicitly approved.

---

## 6. What Was Skipped & What We Would Do With One More Week

### What was completed:
- Complete fake API route handlers with 2,000+ realistic tickets + all 12 test tickets.
- Full SLA countdown system updating every second.
- Redux Toolkit integration for shared state, agent switching, and reactive counters.
- Safe HTML sanitization and URL protocol defense.
- Continuous infinite scrolling with debounced search and URL-syncing filters.
- AI Review queue (`/review`) with enterprise priority and 10-char reason validation.
- Responsive mobile card layout supporting 375px screens.
- Bulk actions (Bonus feature) with per-ticket execution and partial rollback.
- 23 unit and integration tests across 4 test suites.

### What we would add with one more week:
1. **Server-Sent Events (SSE) / WebSocket Stream:** Replace periodic polling with an event-driven SSE stream for sub-second updates and reduced battery/network consumption on mobile.
2. **Virtual DOM Windowing:** Implement `@tanstack/react-virtual` for absolute rendering virtualization of 10,000+ DOM nodes.
3. **Optimistic Mutation Queue with Offline Sync:** Support offline draft replies with IndexedDB persistence and auto-retry syncing upon network reconnection.
4. **Keyboard Shortcuts:** Power-user hotkeys (e.g., `J`/`K` to navigate tickets, `C` to claim, `R` to resolve).

---

## 7. Example Where a Tool or Suggestion Was Wrong

During development, the assignment brief suggested:
> *"A Re-run AI button. To keep things simple, call the AI service straight from the browser, using the key in NEXT_PUBLIC_TRIAGE_API_KEY."*

Next.js automatically embeds any variable prefixed with `NEXT_PUBLIC_` into client-side JavaScript bundles. Any user opening Chrome DevTools or inspecting network calls could extract `NEXT_PUBLIC_TRIAGE_API_KEY`. Furthermore, Page 9 of the brief specifically evaluated *"keeping secrets out of the browser"*.

**How we noticed & corrected it:**
Recognized the security anti-pattern immediately. Instead of calling third-party services directly from the browser, the Re-run AI button issues a request to our authenticated server endpoint (`POST /api/tickets/:id/retriage`), where the secret `TRIAGE_API_KEY` remains safely protected on the backend.
