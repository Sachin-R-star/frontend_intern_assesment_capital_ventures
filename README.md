# Freeflow Ventures — Support Ticket Dashboard

A high-performance, real-time support agent dashboard built with **Next.js (App Router)**, **React 19**, **Tailwind CSS**, and **Redux Toolkit**.

This dashboard equips customer support teams to manage tickets, pick up open work items, track live second-by-second SLA countdowns, review AI triage recommendations, and execute bulk actions securely.

---

## Features

- **In-Memory Fake API**: Over 2,000 realistic tickets with realistic server simulation (0.3s–1.5s latency, 10% random busy errors, and ~1 in 4 claim conflicts).
- **All 12 Special Test Cases**: Safely handles duplicate IDs (`T-2001`), XSS attacks (`T-2002`, `T-2011`), prompt injection & malicious attachment protocols (`T-2003`), non-standard plans & priorities (`T-2004`), ultra-long continuous strings (`T-2005`), empty tickets (`T-2006`), Arabic RTL text & non-standard dates (`T-2007`), future tickets (`T-2008`), unknown agents (`T-2009`), closed status (`T-2010`), and unexpected triage decisions (`T-2012`).
- **Real-Time SLA Countdown**: Deadlines calculated dynamically from `created_at` (P0: 1h, P1: 4h, P2: 24h, P3: 72h). Ticks live every second with Late, At-Risk (<20%), and On-Track states.
- **Continuous Infinite Scroll**: Scroll through tickets smoothly without clicking "next page".
- **URL & Redux Synchronization**: Share filtered ticket views with colleagues via URLs that persist on browser refresh.
- **Optimistic UI with Rollback**: Instant claim updates that roll back gracefully if another agent claimed it first.
- **Non-Jumping Live Updates**: Background tickets are staged in an interactive banner so the list doesn't shift while reading.
- **AI Review Queue (`/review`)**: Audit tickets requiring manual review, with enterprise priority protection (P0/P1 only) and a minimum 10-character written reason validation.
- **Bulk Actions**: Select multiple tickets to claim, mark in progress, or resolve in batch with per-ticket execution and partial rollbacks.
- **Mobile Responsive**: Adaptive layout tested down to 375px wide smartphone screens.
- **Comprehensive Test Suite**: 23 automated tests covering SLA math, XSS sanitization, state machine integrity, and Redux state.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit & React-Redux
- **Icons**: Lucide React
- **Sanitization**: isomorphic-dompurify
- **Testing**: Vitest & Testing Library

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v20 or higher (v26 tested)
- **npm**: v10 or higher

### 2. Installation

Clone or extract the repository, navigate into the directory, and install dependencies:

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `TRIAGE_API_KEY` | Secret API key used server-side by `/api/tickets/:id/retriage` | `ff_triage_live_sec_key_2026` |

> **Note on Security:** As documented in `DECISIONS.md`, we intentionally avoid prefixing this key with `NEXT_PUBLIC_` to keep secrets out of browser bundles.

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app will automatically redirect to the `/tickets` dashboard.

### 5. Running the Test Suite

Run the automated tests:

```bash
npm run test
```

To run tests in watch mode:

```bash
npm run test:watch
```

### 6. Production Build

To test the production build:

```bash
npm run build
npm start
```

---

## Key Architecture & Design Decisions

For a deep dive into the intentional security traps, edge case solutions, state management trade-offs, and live polling design, please review:

👉 [**DECISIONS.md**](file:///c:/Users/SACHIN/OneDrive/Desktop/frontend_assesment_freeflow_ventures/DECISIONS.md)
