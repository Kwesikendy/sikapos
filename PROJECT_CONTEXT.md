# SikaPOS (Akoma Commerce Cloud) — Comprehensive Project Context

> **Last Updated:** October 7, 2026  
> **Maintainer:** Mastermade Solutions  
> **Target Audience:** Developers, AI Coding Agents, QA Engineers  
> **Purpose:** Canonical documentation of the SikaPOS architecture, runtime environments, demo credentials, database schemas, authentication workflows, and UI systems to eliminate redundant code-analysis cycles.

---

## 1. Executive Summary

**SikaPOS** (*Sika* = Gold / Money in Akan) is a multi-tenant, offline-resilient Cloud Point of Sale (POS) and retail management platform built specifically for modern Ghanaian and West African merchants (provision stores, supermarkets, community pharmacies, boutiques, electronic shops).

Key capabilities:
- **Ghana-Native POS Operations:** Instant MTN MoMo, Telecel Cash, AT Money, and Cash tender workflows.
- **Regulatory Compliance:** Pre-configured GRA (Ghana Revenue Authority) tax structures (VAT 15%, NHIL 2.5%, GETFund 2.5%, COVID-19 Health Recovery Levy 1%).
- **Multi-Tenant Isolation:** Complete logical tenant separation by `tenant_id` across database tables, sessions, products, branches, and audit logs.
- **Hybrid PWA & Offline Support:** Installable desktop/mobile progressive web app with Service Worker caching and local fallback.

---

## 2. Ports & Runtime Environments

| Service | Port | URL | Notes |
| :--- | :--- | :--- | :--- |
| **Express Backend** | **`3003`** | `http://localhost:3003` | Primary Node.js API server (`node server.ts`) |
| **API Health Check** | **`3003`** | `http://localhost:3003/api/v1/health` | Returns `{ success: true, data: { status: 'healthy', database: 'connected' } }` |
| **Production SPA** | **`3003`** | `http://localhost:3003/` | Express directly serves compiled `dist/client/` SPA bundle with clean client-side routing |
| **Vite Dev Server** | **`5173`** | `http://localhost:5173` | React 19 dev server with HMR. Proxies `/api` -> `http://localhost:3003` |

### Starting the Applications
- **Start Backend:** `npm run dev` or `node server.ts` (listens on `http://0.0.0.0:3003`)
- **Start Frontend Dev Server:** `npm run dev:client` (runs on `http://localhost:5173`)
- **Build Client Bundle:** `npm run build:client` (compiles to `dist/client/`)
- **Run Tests:** `npm test`

---

## 3. Seeded Demo Accounts & Credentials (Ready for Testing)

The database automatically seeds standard demo data on initialization via `src/db/init.ts`:

- **Tenant ID:** `ten_default_osu` (Mensah Stores Ghana Ltd / Mensah Stores Osu)
- **Primary Branch ID:** `br_default_osu` (Osu Oxford St. Branch, Greater Accra, `GA-183-9024`)

### A. Store Owner / Admin Account
- **Full Name:** Kwabena Mensah
- **Email:** `kwabena@mensahstores.com`
- **Phone:** `0244123456`
- **Password:** `OsuPass2025#`
- **PIN:** `1234`
- **User ID:** `usr_owner_001`
- **Role:** `Owner` (Full permissions: inventory, sales, team, reports, store settings)

### B. Cashier Station 1
- **Full Name:** Abena Osei
- **Email:** `abena@mensahstores.com`
- **Phone:** `0244123457`
- **PIN:** `1234`
- **User ID:** `usr_cashier_001`
- **Role:** `Cashier` (Front Counter terminal sales & receipting)

### C. Cashier Station 2
- **Full Name:** Kofi Boateng
- **Email:** `kofi@mensahstores.com`
- **Phone:** `0244123458`
- **PIN:** `1234`
- **User ID:** `usr_cashier_002`
- **Role:** `Cashier` (Express Till register)

---

## 4. Authentication Architecture

SikaPOS supports four distinct authentication flows:

1. **Owner / Manager Password Login (`POST /api/v1/auth/login`)**:
   - Body: `{ email: "kwabena@mensahstores.com", password: "OsuPass2025#" }` (or phone number `0244123456`)
   - Supports multi-tenant resolution: If a phone/email is registered across multiple stores, returns `409 MULTIPLE_TENANTS_FOUND` with tenant options list so the user can choose which store to log into.
2. **Cashier Fast-Switch PIN Login (`POST /api/v1/auth/login-pin`)**:
   - Body: `{ tenantId: "ten_default_osu", cashierId: "usr_cashier_001", pin: "1234" }`
   - Designed for high-speed terminal switching between shifts without entering full passwords.
3. **Ghanaian Phone OTP Verification (`POST /api/v1/auth/login-otp/request` & `verify`)**:
   - SMS delivery via Moolre VAS API (`moolre.com`), normalized to `+233XXXXXXXXX` or `0XXXXXXXXX`.
   - Sandbox / dev mode exposes `debugCode` for instant local testing without live SMS charges.
4. **Google / Firebase Sign-In (`POST /api/v1/auth/firebase-login`)**:
   - Accepts Google ID token, verifies against Firebase Admin SDK, and syncs merchant profile.

### Password & Security Details:
- **Hashing Algorithm:** Node.js native `crypto.scryptSync(password, salt, 64)` with 16-byte random hex salts.
- **PIN Hashing:** `crypto.scryptSync(pin, salt, 32)`.
- **Sessions:** Cryptographic 256-bit hex tokens stored in `sessions` table. Expiry default: 24 hours (`SESSION_EXPIRY_HOURS`). Sent in HTTP header: `Authorization: Bearer <token>`.

---

## 5. Directory Structure & Key Files

```text
stitch_multi_tenant_saas_pos_system/
├── server.ts                       # Express server entry point (port 3003)
├── src/                            # Backend source code
│   ├── app.ts                      # Express app configuration, CORS, routes & SPA catch-all
│   ├── config/env.ts               # Environment configuration (default port 3003)
│   ├── db/
│   │   ├── connection.ts           # SQLite connection singleton (better-sqlite3)
│   │   ├── init.ts                 # Schema migration & demo account seeding
│   │   ├── schema.sql              # Base multi-tenant relational schema
│   │   └── schema_phase3.sql       # Extended audit, products, and offline sync tables
│   ├── middleware/                 # Auth, validation, rate limiting, and error handling
│   ├── routes/api/
│   │   ├── auth.routes.ts          # Login, PIN switch, OTP, register, session endpoints
│   │   ├── product.routes.ts       # Inventory CRUD & barcode lookups
│   │   ├── sale.routes.ts          # Sales checkout, receipt generation, MoMo transactions
│   │   ├── tenant.routes.ts        # Staff management, branch profiles, public staff list
│   │   └── health.routes.ts        # API health check (/api/v1/health)
│   └── services/                   # Business logic (AuthService, TenantService, OtpService)
│
├── client/                         # Modern React 19 Frontend
│   ├── vite.config.ts              # Vite config (port 5173, proxy to 3003, VitePWA)
│   ├── src/
│   │   ├── App.tsx                 # Client routes & layout nesting
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx       # Unified Owner, Phone OTP, & Cashier PIN sign-in
│   │   │   ├── CashierLoginPage.tsx# Terminal-specific fast PIN pad switcher
│   │   │   ├── POSPage.tsx         # High-speed point-of-sale register & checkout
│   │   │   ├── DashboardHomePage.tsx # KPI revenue cards, transaction charts, quick links
│   │   │   ├── InventoryPage.tsx   # Stock tracking, reorder levels, product drawer
│   │   │   ├── TransactionsPage.tsx# Sales receipts, payment methods breakdown
│   │   │   ├── ReportsPage.tsx     # Z-reports, tax liabilities, cashier reconciliations
│   │   │   ├── TeamPage.tsx        # Staff list, role assignments, cashier PIN changes
│   │   │   └── SettingsPage.tsx    # Store details, receipt printer setup, GRA tax toggle
│   │   ├── components/ui/          # Reusable UI library (Button, Input, Modal, Toast, etc.)
│   │   ├── context/AuthContext.tsx # Global authentication provider & session state
│   │   └── api/client.ts           # Centralized Fetch HTTP client with Bearer auth
│
├── dist/client/                    # Production built assets served by Express
├── docs/                           # Architectural specs & legal drafts
└── PROJECT_CONTEXT.md              # THIS FILE
```

---

## 6. Frontend Navigation & Routes

| Route | Component | Access | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Public | Main login supporting Owner password, Phone OTP, and Cashier PIN |
| `/cashier-login` | `CashierLoginPage` | Public | Dedicated POS station PIN keypad with avatar quick-select |
| `/merchant-signup` | `MerchantSignupPage` | Public | 4-step store registration wizard with phone verification |
| `/store-setup` | `StoreSetupPage` | Protected | Initial store onboarding (currency, branch, business hours) |
| `/launch-readiness` | `LaunchReadinessPage`| Protected | Hardware, receipt printer, and scanner readiness checklist |
| `/pos` or `/terminal`| `POSPage` | Protected | Full-screen retail cash register, cart, barcode scanner, MoMo tender |
| `/dashboard` | `DashboardHomePage` | Protected | Executive dashboard with GMV, average basket, sales graph |
| `/dashboard/inventory`| `InventoryPage` | Protected | Product catalog with low stock badges, categories, search |
| `/dashboard/transactions`| `TransactionsPage` | Protected | Historical transaction log with receipt re-print |
| `/dashboard/reports` | `ReportsPage` | Protected | Daily audit reports, GRA tax summary, operator metrics |
| `/dashboard/team` | `TeamPage` | Protected | Employee directory, role permissions, cashier PIN manager |
| `/dashboard/settings` | `SettingsPage` | Protected | Tax profile (GRA standard vs flat), store addresses, MoMo payout |
| `/legal` | `LegalPage` | Public | Ghana Act 843 compliant Privacy Policy & terms |

---

## 7. Ghana Specifics & Localization

1. **Currency Formatting:**
   - Always display currency using `formatGHS(amount)` from `client/src/lib/utils.ts`.
   - Output format: `GH₵ 1,250.00` with explicit Ghanaian Cedi sign (`GH₵`) and comma thousands separators.
2. **Mobile Money Networks Supported:**
   - **MTN MoMo** (Yellow branding, `#FFCC00`)
   - **Telecel Cash** (Red branding, `#E60000`)
   - **AT Money** (Blue branding, `#0055A5`)
3. **GRA Tax Configuration:**
   - Standard 3-tier GRA tax calculation engine configured in `src/db/init.ts` (`tax_default_osu`):
     - **VAT:** 15.0%
     - **NHIL (National Health Insurance Levy):** 2.5%
     - **GETFund (Ghana Education Trust Fund):** 2.5%
     - **COVID-19 Health Recovery Levy:** 1.0%

---

## 8. Development & Coding Rules for AI Agents

1. **Port Consistency:** Always use port **3003** for the backend Express server. Never reset it back to 3000.
2. **SPA Routing Integrity:** When adding new routes to `client/src/App.tsx`, ensure `src/app.ts` continues to serve `dist/client/index.html` via the catch-all route so manual browser refreshes never 404.
3. **Database Schema Migrations:** SQLite schemas in `src/db/init.ts` use defensive column migration helpers (`safeAddColumn`). Never issue raw `DROP TABLE` commands in production databases.
4. **UI Design Standard:**
   - Use the established color tokens: Primary Emerald (`#0D5C3A`), Brand Accent (`#00A859`), Gold Amber (`#D97706`).
   - Use reusable primitives from `client/src/components/ui/` (`Button`, `Input`, `PhoneInput`, `StatusBadge`, `Modal`, `Toast`, `PinKeypad`).
5. **Always update this file** (`PROJECT_CONTEXT.md`) and `.agents/rules/project_context.md` whenever key architectural decisions, routes, or credentials change.
