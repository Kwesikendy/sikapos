# SikaPOS / Akoma Commerce Cloud — Phase 0 Architecture & Foundation

## Executive Summary

Phase 0 establishes the multi-tenant architectural, database, authorization, cryptographic, and operational foundation for **SikaPOS / Akoma Commerce Cloud**. It implements strict server-authoritative tenant isolation, relational persistence via SQLite (`better-sqlite3`), role-based access control (RBAC), provider-agnostic OTP verification, Ghana Revenue Authority (GRA) compliant tax structures, and terminal identity management without taking shortcuts or building ahead into unapproved product phases.

---

## 1. System Architecture Overview

```
                                      +------------------------------------+
                                      |   Browser Clients / Terminals      |
                                      |   - Stage 2 Stitch Screens         |
                                      |   - Future React / PWA POS         |
                                      +-----------------+------------------+
                                                        |
                                       HTTP / REST API  | Bearer Session Token
                                                        v
+----------------------------------------------------------------------------------------------------+
| Express Application Layer                                                                           |
|                                                                                                    |
|  [Security & Body Parsing] -> [Auth Middleware] -> [Tenant Context Middleware] -> [RBAC / Perms]  |
|                                                                                                    |
|  API Endpoints (/api/v1):                                                                          |
|   ├── /health               -> Live health & DB diagnostic checks                                  |
|   ├── /auth                 -> Decoupled OTP request/verify, registration, owner/PIN logins        |
|   ├── /tenants              -> Tenant profiles, multi-branch management, staff & cashiers          |
|   ├── /tax                  -> GRA VAT/NHIL/GETFund engine, custom tax profiles, live simulator   |
|   ├── /devices              -> POS terminal & register registration, heartbeats, sync queue        |
|   └── /audit                -> Compliance audit trails scoped to verified tenant                   |
|                                                                                                    |
|  Static Routes (Preserved Stage 2 Google Stitch Screens):                                          |
|   ├── /                     -> Stage 2 Navigator Dashboard                                         |
|   ├── /merchant-signup      -> Merchant Signup & Welcome Screen                                    |
|   ├── /store-setup          -> Business & Store Setup Wizard Screen                                |
|   ├── /launch-readiness     -> Cashier PIN & Launch Readiness Screen                               |
|   └── /cashier-login        -> Cashier PIN Login & OTP Verification Screen                         |
+----------------------------------------------------------------------------------------------------+
                                                        |
                                                        v
+----------------------------------------------------------------------------------------------------+
| Business Domain Services Layer                                                                     |
|  - TenantService  : Tenant lifecycles, branch topologies, organization-scoped queries              |
|  - AuthService    : Scrypt password/PIN cryptography, 256-bit bearer sessions, timing-safe auth    |
|  - OtpService     : Provider-agnostic abstraction (IOtpProvider), sandbox adapter, attempt lockouts |
|  - TaxService     : GRA 3-tier tax computation (VAT 15%, NHIL 2.5%, GETFund 2.5%), GH₵ formatter  |
|  - DeviceService  : Hardware registration, status tracking, idempotent sync duplicate prevention   |
|  - AuditService   : Structured actor/tenant/action/entity/IP compliance logging                    |
+----------------------------------------------------------------------------------------------------+
                                                        |
                                                        v
+----------------------------------------------------------------------------------------------------+
| SQLite Database Layer (better-sqlite3)                                                             |
|  - Strict Foreign Keys (PRAGMA foreign_keys = ON)                                                  |
|  - Write-Ahead Logging (PRAGMA journal_mode = WAL)                                                 |
|  - Indexed by tenant_id on all multi-tenant tables                                                  |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Database Schema & Relational Design

The schema resides in `src/db/schema.sql` and enforces strict relational integrity:

1. **`tenants`**: Organizations and merchant business entities (`id`, `legal_name`, `business_name`, `trade_category`, `currency_code`, `status`, `created_at`, `updated_at`).
2. **`branches`**: Physical storefronts or fulfillment outlets (`id`, `tenant_id`, `name`, `is_primary`, `region`, `gps_digital_address`, `physical_address`, `phone`, `status`). Cascades on tenant delete.
3. **`users`**: Human actors (Owners, Managers, Cashiers, Inventory Attendants). Contains salted `scrypt` password hashes for backoffice web login, and separate salted `scrypt` PIN hashes for rapid cashier switches. Enforces unique `(tenant_id, email)` and `(tenant_id, phone_number)`.
4. **`roles`**: System roles (`Owner`, `Manager`, `Cashier`, `Inventory Staff`, `Platform Admin`).
5. **`permissions`**: Granular action codes (e.g., `products.view`, `sales.create`, `employees.manage`, `settings.manage`).
6. **`role_permissions`**: Many-to-many junction mapping roles to authorized permissions.
7. **`user_roles`**: Many-to-many junction associating users with roles within a tenant.
8. **`branch_users`**: Associates users with one or more physical branches.
9. **`tax_profiles`**: Data-driven tax profiles (`not_registered`, `standard_gra`, `custom`). Stores rates for VAT (15%), NHIL (2.5%), GETFund (2.5%), and COVID Levy.
10. **`devices`**: Terminal and register hardware identity (`device_identifier`, `device_type`, `hardware_model`, `last_heartbeat_at`, `sync_status`).
11. **`auth_sessions`**: High-entropy 256-bit server sessions stored as SHA-256 digests with explicit tenant linkage and TTL expiration.
12. **`audit_logs`**: Tamper-evident trail capturing tenant, user, action, entity type, entity ID, client IP, user agent, and contextual JSON metadata.
13. **`otp_verifications`**: Decoupled OTP store tracking recipient, scrypt hash, purpose, attempts counter (max 3), expiry (10 min), and verification timestamps.
14. **`offline_sync_events`**: Idempotent duplicate-prevention foundation for future Phase 11 offline queue synchronization (`client_event_id UNIQUE`).

---

## 3. Server-Authoritative Tenant Isolation Model

Tenant isolation is never delegated to client trust:
- **No Client Spoofing**: The authenticated session token is the sole source of truth for the actor's `tenant_id`.
- **Anti-Tampering Guard**: If an incoming request includes an `x-tenant-id` header or body `tenant_id` that diverges from `session.tenant_id`, the request is immediately aborted with `HTTP 403 TENANT_MISMATCH`.
- **Database Boundary**: Every query affecting branches, devices, users, tax rules, and audit trails explicitly filters on `tenant_id = ?`.
- **Foreign Key Cascades**: SQLite foreign keys prevent orphaned entities and enforce strict organizational boundaries.

---

## 4. Roles and Permissions Model (RBAC)

The initial system establishes the following role-permission matrix:

| Permission Code | Owner | Manager | Cashier | Inventory Staff | Platform Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `products.view` | ✓ | ✓ | ✓ | ✓ | |
| `products.create` | ✓ | ✓ | | | |
| `products.update` | ✓ | ✓ | | | |
| `products.delete` | ✓ | | | | |
| `inventory.view` | ✓ | ✓ | | ✓ | |
| `inventory.adjust` | ✓ | ✓ | | ✓ | |
| `inventory.receive` | ✓ | ✓ | | ✓ | |
| `inventory.count` | ✓ | ✓ | | ✓ | |
| `sales.view` | ✓ | ✓ | ✓ | | |
| `sales.create` | ✓ | ✓ | ✓ | | |
| `sales.refund` | ✓ | ✓ | | | |
| `customers.view` | ✓ | ✓ | ✓ | | |
| `customers.create` | ✓ | ✓ | ✓ | | |
| `customers.update` | ✓ | ✓ | | | |
| `reports.view` | ✓ | ✓ | | | |
| `employees.manage` | ✓ | ✓ | | | |
| `settings.manage` | ✓ | ✓ | | | |
| `subscription.manage`| ✓ | | | | |

*Note: Owners automatically inherit tenant-wide administrative authority.*

---

## 5. Authentication, PIN Fast-Switch & Provider-Agnostic OTP

1. **Owner / Manager Authentication**:
   - Password hashed via Node's native `crypto.scryptSync(password, salt, 64)`.
   - Generates 256-bit crypto session tokens.
2. **Cashier Fast-Switch PIN**:
   - 4-digit numeric PIN verified via `crypto.scryptSync(pin, salt, 32)` with timing-safe comparison (`crypto.timingSafeEqual`).
   - Enables rapid lane operator switching on POS hardware without exposing backoffice passwords.
3. **Provider-Agnostic OTP Architecture**:
   - Standardized interface: `IOtpProvider { sendOtp(recipient, code, purpose): Promise<OtpSendResult> }`.
   - Current implementation: `SandboxOtpProvider` decoupled from live telecom aggregators.
   - Enforces 6-digit numeric generation, 10-minute expiry, salt hashing, and a strict 3-attempt brute-force lockout.

---

## 6. Ghana Revenue Authority (GRA) Tax Engine

Conforms to standard GRA calculation methodology:
- **Subtotal**: Base retail price.
- **NHIL**: $2.5\%$ of Subtotal.
- **GETFund**: $2.5\%$ of Subtotal.
- **Taxable Base for VAT**: $\text{Subtotal} + \text{NHIL} + \text{GETFund}$.
- **VAT**: $15.0\%$ of Taxable Base.
- **Formatted Presentation**: Strict Ghanaian Cedi formatting e.g. `GH₵ 1,207.50` with monospace `tabular-nums` support.

---

## 7. Verification Evidence

All 16 automated verification tests pass with 0 failures:

```
TAP version 13
# Subtest: Verification 1: Application starts and health endpoint responds
ok 1 - Verification 1: Application starts and health endpoint responds
# Subtest: Verification 2 & 12: Existing Stage 2 routes and UI assets are preserved and responsive
ok 2 - Verification 2 & 12: Existing Stage 2 routes and UI assets are preserved and responsive
# Subtest: Verification 3: Database connectivity and foreign keys enforced
ok 3 - Verification 3: Database connectivity and foreign keys enforced
# Subtest: Verification 4: Tenant records can be created with legal & trade details
ok 4 - Verification 4: Tenant records can be created with legal & trade details
# Subtest: Verification 5: Branches belong strictly to the correct tenant
ok 5 - Verification 5: Branches belong strictly to the correct tenant
# Subtest: Verification 6: Users belong strictly to the correct tenant and inherit roles
ok 6 - Verification 6: Users belong strictly to the correct tenant and inherit roles
# Subtest: Verification 7: Roles and permissions system definitions
ok 7 - Verification 7: Roles and permissions system definitions
# Subtest: Verification 7: Cashier vs Owner role permission separation
ok 8 - Verification 7: Cashier vs Owner role permission separation
# Subtest: Verification 8: Server-side tenant isolation guarantees
ok 9 - Verification 8: Server-side tenant isolation guarantees
# Subtest: Verification 9: Unauthorized access is rejected with 401
ok 10 - Verification 9: Unauthorized access is rejected with 401
# Subtest: Verification 10: Invalid input is strictly rejected with 400
ok 11 - Verification 10: Invalid input is strictly rejected with 400
# Subtest: Verification 11: Secrets and password hashes are never exposed
ok 12 - Verification 11: Secrets and password hashes are never exposed
# Subtest: Decoupled OTP lifecycle: Request, Sandbox delivery, and Verification
ok 13 - Decoupled OTP lifecycle: Request, Sandbox delivery, and Verification
# Subtest: Tax Service: Standard GRA calculation and currency formatting
ok 14 - Tax Service: Standard GRA calculation and currency formatting
# Subtest: Tax Service: Not VAT registered profile (0% tax)
ok 15 - Tax Service: Not VAT registered profile (0% tax)
# Subtest: Device Service: Terminal registration, heartbeat and idempotent sync queue
ok 16 - Device Service: Terminal registration, heartbeat and idempotent sync queue
1..16
# tests 16
# pass 16
# fail 0
```
