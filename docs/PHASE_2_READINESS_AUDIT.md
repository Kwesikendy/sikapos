# SikaPOS / Akoma Commerce Cloud — Phase 2 Readiness Audit: Merchant Onboarding

**Audit Date**: September 23, 2026  
**Auditor**: Senior Full-Stack Security & Systems Architect  
**Scope**: Read-Only Merchant Onboarding Readiness Audit  
**Status**: READ-ONLY AUDIT COMPLETE (No code, schema, or configuration modified)

---

## Executive Summary

This readiness audit comprehensively evaluates the repository across the 20 required onboarding dimensions. The Phase 0 foundational architecture, Phase 1 multi-tenant authentication, and the modernized React 19 + TypeScript + Vite frontend provide a solid, security-hardened baseline. All 55 automated backend and frontend tests currently pass cleanly in 2.1 seconds.

However, bridging the approved Stage 2 Stitch onboarding flow (**Signup → Phone OTP → Store Setup Wizard → Terminal Launch Readiness → Cashier Fast-Switch**) into a production-grade, end-to-end operational flow requires addressing key gaps:
1. **Contract/Schema Mismatches**: Trade category values in frontend vs database check constraints, and missing address fields on the initial signup form that are currently mandated by `/register`.
2. **Missing Progression APIs**: Lack of tenant update, branch update, owner PIN setup, and settlement account persistence endpoints.
3. **Frontend-to-Backend Integration Gaps**: While the authentication endpoints are connected to real backend services, the Store Setup Wizard (`/store-setup`) and Launch Readiness Dashboard (`/launch-readiness`) currently manage local state and require integration with real tenant, branch, tax, device, and PIN APIs.

---

## Capability Status Matrix (20 Core Audit Dimensions)

| # | Capability Dimension | Status | Summary Finding |
|---|----------------------|--------|-----------------|
| 1 | Existing Authentication Flow | **Exists and works** | Scrypt password & PIN hashing, 60s OTP cooldown, 3-attempt lockout, multi-tenant email resolution, bearer sessions. |
| 2 | Tenant Creation | **Exists but incomplete** | `TenantService.createTenant` works via `/register`, but no `updateTenant` method or `PATCH /tenants/current` exists. |
| 3 | Branch Creation | **Exists but needs integration** | `createBranch` and `/tenants/branches` exist; primary branch created at signup. Missing branch edit/update endpoint. |
| 4 | User Creation | **Exists and works** | `registerOwner` and `registerCashier` securely provision users with tenant boundaries and proper credentials. |
| 5 | Owner Role Assignment | **Exists and works** | System role 'Owner' is automatically assigned in `user_roles`; grants all tenant permissions. |
| 6 | Tax Profile Creation/Configuration | **Exists but needs integration** | Standard GRA rates (15% VAT, 2.5% NHIL, 2.5% GETFund) and 0% exempt profiles work. Setup wizard UI not yet connected. |
| 7 | Device/Terminal Registration | **Exists but needs integration** | `DeviceService.registerDevice` and `/devices/register` exist with branch validation. Launchpad UI currently displays mock device. |
| 8 | Cashier PIN Setup | **Exists but needs integration** | Cashier PIN creation works in backend. Owner self-service PIN setup endpoint is missing; wizard/launchpad UI not wired. |
| 9 | Session/Auth State | **Exists and works** | 256-bit high-entropy tokens hashed via SHA-256 in `auth_sessions`. Client stores in `sessionStorage` with Bearer headers. |
| 10 | Protected Routes | **Exists and works** | `createAuthMiddleware`, `enforceTenantContext`, and RBAC middleware (`requireRole`, `requirePermission`) strictly enforced. |
| 11 | Existing Onboarding APIs | **Exists but incomplete** | `/auth/signup-otp/*` and `/auth/register` exist. Missing onboarding status, tenant patch, branch patch, and payout APIs. |
| 12 | Existing Onboarding UI | **Exists but needs integration** | Modern React pages exist for all steps. Merchant signup has OTP integration; wizard and launchpad need API wiring. |
| 13 | Database Tables & Relationships | **Exists but incomplete** | 14 relational tables in place. Missing columns for GRA TIN, MoMo settlement account, and tenant onboarding state. |
| 14 | Validation | **Exists and works** | Strict validation for Ghana phone (+233 telco prefixes), email, password complexity, 4-digit PIN, and GhanaPost GPS. |
| 15 | Audit Logging | **Exists and works** | Immutable audit logs track registration, logins, PIN changes, and device pairings. Never logs plaintext secrets. |
| 16 | Error Handling | **Exists and works** | Centralized Express error handler, normalized `ApiError` format, typed codes (`MULTIPLE_TENANTS_FOUND`, `RESEND_COOLDOWN`). |
| 17 | Tenant Isolation | **Exists and works** | Server-authoritative session tenant context; IDOR prevention rejects mismatched `x-tenant-id` with HTTP 403. |
| 18 | Existing Tests | **Exists and works** | 55 automated tests passing across 8 suites covering tenancy, roles, isolation, auth, tax, devices, and UI rules. |
| 19 | Duplicated or Conflicting Logic | **Conflicting/duplicated** | Trade category enums diverge between frontend and DB; `/register` requires fields that the UI collects in Step 2. |
| 20 | Missing Backend Capabilities | **Missing** | Onboarding readiness checklist query, tenant/branch patch endpoints, owner PIN set endpoint, payout persistence. |

---

## A. Current Onboarding Architecture

The existing onboarding architecture spans four sequential stages:

```
[ Stage 02: Merchant Registration ] 
  ├── UI: MerchantSignupPage.tsx (/merchant-signup)
  ├── API: POST /api/v1/auth/signup-otp/request (60s cooldown, carrier detection)
  ├── API: POST /api/v1/auth/signup-otp/verify (6-digit OTP, 3 attempts max)
  └── API: POST /api/v1/auth/register (Creates Tenant, Primary Branch, Owner User, Session)
         ↓
[ Stage 03: Store Setup Wizard ]
  ├── UI: StoreSetupPage.tsx (/store-setup)
  ├── Step 1: Owner Profile Review
  ├── Step 2: Store Details & GhanaPost GPS (GA-183-9024)
  ├── Step 3: Ghana Revenue Authority (GRA) Tax Profile (Standard vs Non-VAT)
  └── Step 4: Master Till PIN & MoMo Payout Destination
         ↓
[ Stage 04: Terminal Launch Readiness ]
  ├── UI: LaunchReadinessPage.tsx (/launch-readiness)
  ├── Fast-switch PIN verification & offline transaction caching toggle
  ├── 5-point launch readiness checklist verification
  └── "Open Cashier Terminal" trigger
         ↓
[ Terminal POS Operation ]
  └── UI: CashierLoginPage.tsx (/cashier-login) (Shift selection + 4-digit tactile PIN)
```

---

## B. Existing Database Support

### Relational Schema (`src/db/schema.sql`)
1. **`tenants`**: `id`, `legal_name`, `business_name`, `trade_category`, `currency_code`, `status`, `created_at`, `updated_at`.
   - *Constraint*: `CHECK(trade_category IN ('provision_supermarket', 'pharmacy', 'fashion', 'electronics', 'general_retail'))`.
   - *Missing*: Column for GRA Taxpayer Identification Number (`tin` or `tax_registration_number`), MoMo settlement payout details, and onboarding completion milestone.
2. **`branches`**: `id`, `tenant_id`, `name`, `is_primary`, `region`, `gps_digital_address`, `physical_address`, `phone`, `status`.
   - *Foreign Key*: References `tenants(id) ON DELETE CASCADE`.
   - *Indexes*: `(tenant_id)`, `(tenant_id, is_primary)`.
3. **`users`**: `id`, `tenant_id`, `full_name`, `email`, `phone_number`, `password_hash`, `salt`, `pin_hash`, `pin_salt`, `is_active`, `email_verified`, `phone_verified`.
   - *Unique*: `(tenant_id, email)`, `(tenant_id, phone_number)`.
4. **`roles` & `user_roles`**: System roles ('Owner', 'Manager', 'Cashier', 'Inventory Staff', 'Platform Admin').
5. **`tax_profiles`**: `id`, `tenant_id`, `name`, `tax_type`, `vat_rate`, `nhil_rate`, `getfund_rate`, `covid_levy_rate`, `is_active`.
   - *Constraint*: `CHECK(tax_type IN ('not_registered', 'standard_gra', 'custom'))`.
6. **`devices`**: `id`, `tenant_id`, `branch_id`, `device_name`, `device_identifier`, `device_type`, `hardware_model`, `last_heartbeat_at`, `sync_status`.
   - *Unique*: `device_identifier`.
7. **`auth_sessions`**: `id`, `user_id`, `tenant_id`, `token_hash`, `expires_at`.
8. **`audit_logs`**: `id`, `tenant_id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `details_json`.
9. **`otp_verifications`**: `recipient`, `otp_code_hash`, `salt`, `purpose`, `attempts_count`, `max_attempts`, `expires_at`, `verified_at`.

---

## C. Existing API Support

### 1. Fully Functional Endpoints
- `POST /api/v1/auth/signup-otp/request` (Rate limited, 60s cooldown, carrier detection)
- `POST /api/v1/auth/signup-otp/verify` (Single-use, lockout after 3 failed attempts)
- `POST /api/v1/auth/register` (Atomic transaction creating tenant, branch, owner, role, session)
- `POST /api/v1/auth/login` (Password login with multi-tenant 409 disambiguation)
- `POST /api/v1/auth/login-pin` (4-digit cashier fast-switch login)
- `GET  /api/v1/auth/me` (Authenticated user & tenant profile inspection)
- `POST /api/v1/auth/logout` (Server-side session revocation)
- `GET  /api/v1/tenants/current` (Tenant organization profile)
- `GET  /api/v1/tenants/branches` (Branch listing for authenticated tenant)
- `POST /api/v1/tenants/branches` (Create new branch with `settings.manage` permission)
- `GET  /api/v1/tenants/users` (List tenant staff with `employees.manage` permission)
- `POST /api/v1/tenants/cashiers` (Register new cashier with 4-digit PIN)
- `GET  /api/v1/tax/current` (Active GRA tax profile)
- `POST /api/v1/tax/configure` (Update active tax profile)
- `POST /api/v1/tax/simulate` (Unauthenticated tax calculation simulation)
- `POST /api/v1/devices/register` (Register POS terminal or register hardware)
- `POST /api/v1/devices/heartbeat` (Terminal heartbeat ping)
- `GET  /api/v1/devices/branch/:branchId` (List devices for branch)

### 2. Missing Onboarding Endpoints
- `PATCH /api/v1/tenants/current`: Update tenant trade name, legal name, category, TIN.
- `PATCH /api/v1/tenants/branches/:id`: Update primary branch details (GPS address, name, physical location).
- `POST /api/v1/auth/pin`: Set or update the authenticated user's own 4-digit cashier PIN.
- `POST /api/v1/tenants/payout-config`: Persist settlement Mobile Money wallet details.
- `GET  /api/v1/tenants/onboarding-status`: Compute real launchpad readiness (verifies that phone is verified, store details are complete, tax profile is chosen, PIN is configured, and terminal is paired).

---

## D. Existing Frontend Support

### 1. Modernized Pages
- [MerchantSignupPage.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/pages/MerchantSignupPage.tsx): Connected to `authApi.requestSignupOtp` and `authApi.verifySignupOtp`. Has phone carrier detection, 60s cooldown timer, and registration modal.
- [StoreSetupPage.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/pages/StoreSetupPage.tsx): Implements 4-step progressive Stepper, category selector, GRA VAT selector, and MoMo payout form. Currently saves to local React state only.
- [LaunchReadinessPage.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/pages/LaunchReadinessPage.tsx): Implements terminal test PIN keypad, offline toggle, and readiness checklist. Currently displays hardcoded mock items.
- [CashierLoginPage.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/pages/CashierLoginPage.tsx): Connected to `authApi.loginWithPin` and `authApi.loginWithPassword`. Shift selector, tactile keypad, and admin login tab with multi-tenant modal.

### 2. UI Component Primitives
- [Button.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/ui/Button.tsx), [Input.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/ui/Input.tsx), [PhoneInput.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/ui/PhoneInput.tsx), [PinKeypad.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/ui/PinKeypad.tsx), [Card.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/ui/Card.tsx), [Badge.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/ui/Badge.tsx), [Alert.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/ui/Alert.tsx), [Modal.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/ui/Modal.tsx), [Stepper.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/ui/Stepper.tsx), [BrandLogo.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/visuals/BrandLogo.tsx), [PosTerminalMockup.tsx](file:///d:/stitch_multi_tenant_saas_pos_system/client/src/components/visuals/PosTerminalMockup.tsx).

---

## E. Authentication Dependencies

1. **OTP Verification Gate**:
   - `POST /auth/register` requires that `ownerPhone` was verified within the last 15 minutes via `otpService.isRecipientVerified(phone, 'merchant_signup')`.
   - In development/testing, sandbox mode provides `debugCode`. In production, delivery is dispatched via SMS/MoMo gateway.
2. **Session Persistence**:
   - Successful registration issues a 256-bit bearer token and returns `{ token, tenant, primaryBranch, user }`.
   - The token is held in `sessionStorage` via `apiClient.setToken(token)`.
   - Subsequent requests to `/store-setup` and `/launch-readiness` require this Bearer token to authorize tenant and tax modifications.
3. **Session Revocation**:
   - Changing a user PIN or password invokes `authService.revokeUserSessions(userId)` to invalidate active sessions across all devices for security.

---

## F. Tenant/Branch Dependencies

1. **Relational Invariants**:
   - Every tenant must have at least one primary branch (`is_primary = 1`).
   - Every user belongs strictly to one `tenant_id`.
   - Branches belong strictly to one `tenant_id`. Cross-tenant branch references are prevented by foreign key and application-level checks.
2. **Multi-Step Progression Conflict**:
   - Current `/register` route requires:
     - `primaryBranchName`
     - `primaryBranchRegion`
     - `primaryBranchGps`
     - `primaryBranchAddress`
   - However, the Stage 2 Stitch signup screen only collects `businessName`, `branchName`, `ownerFullName`, `ownerPhone`, `ownerEmail`, and `password`. The full GhanaPost GPS address and region are collected in **Step 2 of the Store Setup Wizard**.
   - **Resolution for Phase 2**: Either:
     - Allow `/register` to accept sensible defaults (`region: 'Greater Accra'`, `primaryBranchGps: 'PENDING'`, `primaryBranchAddress: 'Main Store'`) which are updated during Step 2 of the wizard via `PATCH /tenants/branches/:id`; OR
     - Stagger tenant creation into a draft/provisional state. (Recommended: Option A, which maintains backward compatibility with Phase 0/1 tests).

---

## G. Tax Configuration Dependencies

1. **GRA Legal Compliance**:
   - Ghana Revenue Authority standard tax schedule:
     - VAT: 15.0%
     - NHIL: 2.5%
     - GETFund: 2.5%
     - COVID Levy: 0.0%
   - Not VAT Registered: 0.0% tax.
2. **Persistence**:
   - Handled via `TaxService.setTaxProfile(tenantId, params)` which deactivates prior profiles and inserts a new active record in `tax_profiles`.
   - Protected endpoint `POST /api/v1/tax/configure` is ready; frontend `StoreSetupPage` Step 3 simply needs to invoke this endpoint with `taxType: 'standard_gra'` or `'not_registered'`.

---

## H. Device/PIN Dependencies

1. **PIN Security**:
   - 4-digit numeric validation (`/^\d{4}$/`).
   - Hashed using `crypto.scryptSync(pin, salt, 32)` with individual 16-byte random salt.
   - Evaluated in constant time (`crypto.timingSafeEqual`).
2. **Terminal Identity**:
   - `devices` table requires unique `device_identifier`.
   - `DeviceService.registerDevice` requires `tenantId`, `branchId`, `deviceName`, `deviceIdentifier`, `deviceType`, `hardwareModel`.
   - The Launch Readiness step should auto-register the browser register terminal (e.g. `deviceIdentifier: 'POS-' + tenant.slug + '-TILL-01'`) and store it in local storage.

---

## I. Security Considerations

1. **No Client-Trust Isolation**: Client tenant parameters must never override the server session tenant context. The existing `enforceTenantContext` middleware strictly prevents IDOR.
2. **Credential Sanitization**: `password_hash`, `salt`, `pin_hash`, and `pin_salt` are strictly stripped from all API outputs via `getUserSummary()`.
3. **Rate Limiting**: `otpLimiter` and `loginLimiter` protect against brute-force and credential stuffing.
4. **Audit Immutability**: All setup actions (registration, tax selection, device creation, PIN assignment) write structured records to `audit_logs`.
5. **No Emojis & Natural Language**: All backend error messages and frontend copy follow the established restraint rules (no emojis, no em dashes).

---

## J. Test Coverage

- **Current Status**: 55 automated tests passing across 8 test suites.
- **Coverage Breakdown**:
  - `01_app_and_routes.test.ts`: Health, Stage 2 route loading, basic navigation.
  - `02_database_and_tenancy.test.ts`: Foreign keys, tenant creation, branch isolation.
  - `03_roles_and_permissions.test.ts`: RBAC definitions, Owner vs Cashier permissions.
  - `04_tenant_isolation.test.ts`: Cross-tenant boundary enforcement, IDOR rejection.
  - `05_auth_and_security.test.ts`: Password hashing, salt randomness, decoupled OTP lifecycle.
  - `06_tax_and_devices.test.ts`: Standard GRA 3-tier tax calculation, device registration, heartbeat, sync queue.
  - `07_phase1_authentication.test.ts`: 34 comprehensive Phase 1 tests (OTP cooldown, lockout, multi-tenant resolution, PIN auth, session revocation).
  - `08_frontend_modernization.test.ts`: Telco detection, tabular formatting, zero emojis constraint, zero em dashes constraint, build artifacts.

---

## K. Missing Pieces (Gaps to Address in Phase 2)

### 1. Database Schema
- [ ] Add `tax_registration_number` (TIN) column to `tenants` (or `tax_profiles`) table.
- [ ] Add `payout_phone` and `payout_carrier` columns to `tenants` table.
- [ ] Add `onboarding_step` (`INTEGER DEFAULT 1`) and `onboarding_completed_at` (`TEXT`) to `tenants` table to track progress.

### 2. Backend Services & Routes
- [ ] Add `updateTenant(tenantId, params)` to `TenantService`.
- [ ] Add `PATCH /api/v1/tenants/current` endpoint to `tenant.routes.ts`.
- [ ] Add `updateBranch(tenantId, branchId, params)` to `TenantService`.
- [ ] Add `PATCH /api/v1/tenants/branches/:id` endpoint to `tenant.routes.ts`.
- [ ] Add `setUserPin(userId, pin)` / `POST /api/v1/auth/pin` for self-service owner PIN setup.
- [ ] Add `GET /api/v1/tenants/onboarding-status` returning dynamic launchpad readiness data.

### 3. Frontend Services & Pages
- [ ] Create `client/src/api/tenant.api.ts` (methods for current tenant, update tenant, branches, update branch, cashiers, onboarding status).
- [ ] Create `client/src/api/tax.api.ts` (methods for current tax profile, configure tax profile).
- [ ] Create `client/src/api/device.api.ts` (methods for register device, record heartbeat).
- [ ] Fix `tradeCategory` in `MerchantSignupPage.tsx` from `'grocery_minimart'` to valid `'provision_supermarket'`.
- [ ] Wire `StoreSetupPage.tsx` Step 1, 2, 3, and 4 to real API calls on submit.
- [ ] Wire `LaunchReadinessPage.tsx` to read real onboarding status and trigger device registration + PIN verification.

---

## L. Recommended Phase 2 Implementation Order

1. **Step 1: Database Schema Expansion**
   - Additive-only migration: Add `tax_registration_number`, `payout_phone`, `payout_carrier`, `onboarding_step`, `onboarding_completed_at` to `tenants`.
   - Preserve 100% backward compatibility with Phase 0/1 schema.
2. **Step 2: Domain Services Extension**
   - Implement `updateTenant` and `updateBranch` in `TenantService`.
   - Implement `setUserPin` in `AuthService`.
   - Implement `getOnboardingStatus` in `TenantService`.
3. **Step 3: API Route Implementation**
   - Add `PATCH /api/v1/tenants/current`.
   - Add `PATCH /api/v1/tenants/branches/:id`.
   - Add `POST /api/v1/auth/pin`.
   - Add `GET /api/v1/tenants/onboarding-status`.
4. **Step 4: Frontend API Layer**
   - Implement `tenant.api.ts`, `tax.api.ts`, `device.api.ts`.
   - Expose strongly-typed request and response contracts.
5. **Step 5: Frontend Onboarding Flow Integration**
   - Align `MerchantSignupPage` payload with backend contracts.
   - Connect `StoreSetupPage` step transitions to persist organization, branch, tax profile, and payout details.
   - Connect `LaunchReadinessPage` to load live onboarding readiness checklist from the backend and register the terminal.
6. **Step 6: Automated Testing & Verification**
   - Add Phase 2 automated test suite (`tests/09_phase2_onboarding.test.ts`) covering all onboarding transitions.
   - Verify that all 55 existing tests continue to pass without regression.

---

## M. Risks and Ambiguities

1. **Trade Category Alignment**:
   - Risk: UI has four display chips ("Provision & Supermarket", "Pharmacy & Wellness", "Boutique & Apparel", "Electronics & Repairs").
   - Mitigation: Ensure frontend strictly maps these UI slugs to the DB check constraint values (`provision_supermarket`, `pharmacy`, `fashion`, `electronics`, `general_retail`).
2. **Initial Signup vs Wizard Addressing**:
   - Risk: Stage 2 Stitch signup screen does not ask for GPS digital address, but Step 2 of the setup wizard does.
   - Mitigation: In `POST /register`, make `primaryBranchGps` optional or default to `'GA-000-0000'` / `'PENDING'`, allowing the merchant to provide the verified GhanaPost GPS in the Store Setup Wizard.
3. **Owner PIN vs Cashier PIN**:
   - Risk: Does the store owner use a PIN on the counter terminal, or must they create a separate cashier profile?
   - Mitigation: The architecture supports both. A dedicated `POST /auth/pin` enables the Owner to set their personal till PIN directly, while `/tenants/cashiers` allows provisioning additional shift attendants.

---

## N. Explicit Acceptance Criteria for Phase 2

1. **Merchant Registration**: Merchant can register with Ghanaian phone, verify single-use OTP with 60s cooldown, and create tenant + owner user.
2. **Store Configuration**: Merchant can configure and update business legal name, trade category, primary branch name, and valid GhanaPost GPS address (`^[A-Z]{2}-\d{3,4}-\d{4}$`).
3. **Tax Configuration**: Merchant can select between Standard GRA profile (15% VAT + 2.5% NHIL + 2.5% GETFund) and Not VAT Registered, persisting the active profile to `tax_profiles`.
4. **Cashier PIN Setup**: Store owner can configure a 4-digit PIN for rapid terminal switching, hashed server-side with Scrypt.
5. **Terminal Pairing**: Device terminal record is provisioned and linked to the primary branch with heartbeat acknowledgement.
6. **Launch Readiness Check**: `GET /api/v1/tenants/onboarding-status` returns 100% readiness only when phone, store, tax, PIN, and device requirements are met.
7. **No Security Regressions**: Strict tenant isolation maintained; passwords/PINs never exposed; all 55 existing tests pass; zero emojis, zero em dashes.

---

## Exact Files to Change for Phase 2

### Backend Files to Modify
1. `src/db/schema.sql`: Add `tax_registration_number`, `payout_phone`, `payout_carrier`, `onboarding_step`, `onboarding_completed_at` to `tenants`.
2. `src/services/tenant.service.ts`: Add `updateTenant`, `updateBranch`, and `getOnboardingStatus`.
3. `src/services/auth.service.ts`: Add `setUserPin(userId, pin)`.
4. `src/routes/api/tenant.routes.ts`: Add `PATCH /current`, `PATCH /branches/:id`, `GET /onboarding-status`.
5. `src/routes/api/auth.routes.ts`: Add `POST /pin` self-service endpoint and make initial branch GPS optional during `/register`.
6. `src/types/index.ts`: Update `Tenant` interface to include TIN, payout details, and onboarding milestones.

### Frontend Files to Modify / Create
7. `client/src/api/tenant.api.ts` [NEW]: Client methods for tenant, branch, cashier, and onboarding status.
8. `client/src/api/tax.api.ts` [NEW]: Client methods for tax profile retrieval and configuration.
9. `client/src/api/device.api.ts` [NEW]: Client methods for device pairing and heartbeats.
10. `client/src/types/auth.types.ts`: Update types with onboarding status and payload definitions.
11. `client/src/pages/MerchantSignupPage.tsx`: Fix trade category mapping and connect to updated registration contract.
12. `client/src/pages/StoreSetupPage.tsx`: Wire form step submissions to `tenant.api`, `tax.api`, and `auth.api`.
13. `client/src/pages/LaunchReadinessPage.tsx`: Connect live checklist to `GET /tenants/onboarding-status` and device registration.

### New Test Suite
14. `tests/09_phase2_onboarding.test.ts` [NEW]: Comprehensive automated test suite for Phase 2 merchant onboarding.
