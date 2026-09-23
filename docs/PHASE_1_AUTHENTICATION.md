# SikaPOS / Akoma Commerce Cloud — Phase 1: Authentication Architecture & Implementation

## 1. Authentication Architecture

SikaPOS / Akoma Commerce Cloud implements a security-first, multi-tenant authentication system designed for West African SMB retail environments. 

The architecture strictly decouples tenant boundary resolution, cryptographic verification, credential management, role-based authorization, and communication providers:

```
                                  +---------------------------------------+
                                  |    Browser / POS / Mobile Client      |
                                  +-------------------+-------------------+
                                                      |
                                     HTTP REST API    | Bearer Session Token
                                                      v
+---------------------------------------------------------------------------------------------------------+
| Express Application Layer                                                                               |
|                                                                                                         |
|   [Rate Limiter] ──> [Body Validation] ──> [Auth Middleware] ──> [Tenant Context] ──> [RBAC / Perms]    |
|                                                                                                         |
|  Endpoints (/api/v1/auth):                                                                              |
|    POST /signup-otp/request  ──> Phone OTP Dispatch (60s Server-Side Cooldown)                         |
|    POST /signup-otp/verify   ──> Single-Use OTP Verification (3-Attempt Lockout)                        |
|    POST /register            ──> Merchant Tenant & Owner Account Creation                               |
|    POST /login               ──> Disambiguated Multi-Tenant Email & Password Auth                       |
|    POST /login-pin           ──> Fast-Switch Cashier 4-Digit PIN Authentication                         |
|    GET  /me                  ──> Authenticated Identity & Tenant Context Inspection                     |
|    POST /logout              ──> Explicit Server-Side Session Token Revocation                          |
+---------------------------------------------------------------------------------------------------------+
                                                      |
                                                      v
+---------------------------------------------------------------------------------------------------------+
| Domain Services Layer                                                                                   |
|   - AuthService   : Scrypt password & PIN hashing (timing-safe), bearer session creation & revocation  |
|   - OtpService    : Provider-agnostic OTP lifecycle, 60s cooldown, attempts tracking & lockout          |
|   - TenantService : Organization lifecycle, branch hierarchy, user-role associations                   |
|   - AuditService  : Immutable compliance audit logs (never logs plaintext secrets or raw tokens)        |
+---------------------------------------------------------------------------------------------------------+
                                                      |
                                                      v
+---------------------------------------------------------------------------------------------------------+
| Relational Storage Layer (SQLite via better-sqlite3 with WAL Mode & Foreign Keys ON)                    |
|   - tenants, branches, users, roles, permissions, user_roles, branch_users                              |
|   - auth_sessions (token_hash, expires_at), otp_verifications (otp_code_hash, salt, attempts_count)    |
|   - audit_logs (tenant_id, user_id, action, entity_type, ip_address, user_agent, details_json)          |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Signup Flow

The merchant onboarding authentication flow follows a four-step sequence:

```
[Merchant Enters Phone & Details] 
              ↓
[POST /signup-otp/request] ──> Generates 6-digit numeric OTP & Salt ──> Enforces 60s Cooldown
              ↓
[SMS / MoMo Carrier Alert] (Decoupled Provider Interface)
              ↓
[User Submits Code] ──> [POST /signup-otp/verify] ──> Validates & Marks Verified
              ↓
[POST /register] ──> Verifies Phone OTP Completion ──> Creates Tenant, Branch, Owner User
              ↓
[Issues 256-bit Bearer Session] ──> Stores in SessionStorage ──> Continues to Store Setup
```

---

## 3. OTP Flow & Lifecycle

The OTP system adheres strictly to the decoupled provider interface (`IOtpProvider`). In development and automated testing, `SandboxOtpProvider` handles delivery without external vendor dependency.

### Core Guarantees:
- **60-Second Cooldown**: Server-side enforcement rejecting requests for the same `(recipient, purpose)` within 60 seconds of the prior request (`HTTP 429 RESEND_COOLDOWN`).
- **Attempt Limits**: Maximum 3 attempts allowed per verification record. Upon reaching the limit, the code is locked (`MAX_ATTEMPTS_EXCEEDED`).
- **Single-Use Replay Protection**: Once successfully verified, `verified_at` is set to the current ISO timestamp. Any subsequent attempt to verify or reuse the same code is rejected (`ALREADY_USED`).
- **Cryptographic Storage**: OTPs are salted with 16 cryptographically random bytes and hashed with `scrypt(code, salt, 32)` prior to persistence.
- **Expiration**: Verification challenges strictly expire after 10 minutes (`EXPIRED_CODE`).

---

## 4. Password Login Flow

1. Client submits `{ email, password, tenantId? }`.
2. Server normalizes the email (`toLowerCase().trim()`).
3. Executes a multi-tenant query resolving all active accounts sharing that email.
4. If multiple tenants exist and `tenantId` is omitted, returns HTTP 409 disambiguation (`MULTIPLE_TENANTS_FOUND`).
5. Upon tenant resolution, extracts `password_hash` and `salt`.
6. Computes `scrypt(password, salt, 64)`.
7. Compares hashes in constant time via `crypto.timingSafeEqual`.
8. Updates `last_login_at` in the `users` table.
9. Generates a cryptographically random 256-bit session token, stores the SHA-256 hash in `auth_sessions`, and returns the raw token and user summary.
10. Writes an audit entry for `auth.login_password_success`.

---

## 5. Multi-Tenant Login Disambiguation Strategy

### The Problem
In multi-tenant SaaS systems, users may legally participate in more than one tenant (e.g., an accountant consulting for two retail shops, or an owner operating separate legal entities). Executing `SELECT user WHERE email = ?` and taking the first record causes dangerous cross-tenant contamination.

### SikaPOS Disambiguation Architecture:
1. When `tenantId` is provided in the login payload:
   - The user query is scoped strictly to `WHERE email = ? AND tenant_id = ? AND is_active = 1`.
   - The password comparison occurs only against that specific user context.
   - If not found or wrong tenant, a generic `Invalid email or password` error is returned.
2. When `tenantId` is omitted:
   - If only 1 tenant is associated with that email, authentication proceeds normally.
   - If 2 or more tenants are associated with that email, the API halts and returns `HTTP 409 Conflict`:
     ```json
     {
       "success": false,
       "error": {
         "code": "MULTIPLE_TENANTS_FOUND",
         "message": "Account belongs to multiple organizations. Please specify tenantId.",
         "tenants": [
           { "id": "uuid-1", "businessName": "Alpha Mart", "legalName": "Alpha Ltd" },
           { "id": "uuid-2", "businessName": "Beta Chemist", "legalName": "Beta Ltd" }
         ]
       }
     }
     ```
   - The client UI dynamically displays an organization selector dropdown, allowing the user to select their desired store and submit `{ email, password, tenantId }`.

---

## 6. Session Architecture

- **Token Generation**: `crypto.randomBytes(32).toString('hex')` (256 bits of cryptographic entropy).
- **Token Persistence**: Raw tokens are never stored in the database. Only the SHA-256 hash `crypto.createHash('sha256').update(rawToken).digest('hex')` is stored in `auth_sessions(token_hash)`.
- **Validation**: Incoming `Authorization: Bearer <token>` requests are hashed and validated:
  ```sql
  SELECT s.*, u.is_active FROM auth_sessions s
  INNER JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = ? AND s.expires_at > ? AND u.is_active = 1
  ```
- **Context Resolution**: Server-side resolution sets `req.user`, `req.tenantId`, and `req.token`.
- **Expiration**: Standard sessions expire after 24 hours (configurable via `SESSION_EXPIRY_HOURS`).

---

## 7. Logout & Session Revocation

- **Single Session Invalidation**: `POST /api/v1/auth/logout` deletes the matching session record from `auth_sessions`. Subsequent requests using the same token fail with `401 INVALID_TOKEN`.
- **User Session Revocation**: When a user changes their password (`updatePassword`) or cashier PIN (`updateCashierPin`), `revokeUserSessions(userId)` is triggered immediately, revoking all active sessions across all devices for that user.

---

## 8. Cashier Fast-Switch PIN Authentication

- **Purpose**: High-velocity terminal shift changes on POS registers.
- **PIN Requirements**: Exactly 4 numeric digits (`/^\d{4}$/`).
- **Cryptography**: Hashed using `scrypt(pin, salt, 32)` and verified using `crypto.timingSafeEqual`.
- **Scope & Isolation**: Scoped strictly to `(tenant_id, cashier_id, pin)`.
- **Privilege Separation**: A cashier login generates a session bound strictly to the `Cashier` role. Cashiers are blocked from administrative endpoints (e.g. `POST /api/v1/tenants/branches` or `POST /api/v1/tenants/cashiers`) with `HTTP 403 FORBIDDEN`.

---

## 9. Rate Limiting Middleware

Server-side rate limiting is implemented via `createRateLimiter` (`src/middleware/rateLimit.ts`):
- Keyed by client IP and identity.
- Applies to `/login`, `/login-pin`, `/signup-otp/request`, and `/signup-otp/verify`.
- Configurable window (`AUTH_RATE_LIMIT_WINDOW_MS`) and max attempts (`AUTH_RATE_LIMIT_MAX_ATTEMPTS`).
- Bypassed in automated test environments (`NODE_ENV === 'test'`) to ensure test determinism.

---

## 10. Security Considerations

| Vector | Mitigation Implemented |
|---|---|
| **Brute Force (Password)** | Rate limiting + Scrypt derivation + generic auth error responses |
| **Brute Force (PIN)** | 4-digit format enforcement + rate limiting + constant-time comparison |
| **Brute Force (OTP)** | Maximum 3 attempts per challenge + 60s cooldown per recipient |
| **Replay Attacks** | Single-use `verified_at` timestamp lock |
| **Session Hijacking / Theft** | Raw tokens never stored on server (only SHA-256 hashes stored) |
| **Tenant Crossover / IDOR** | `enforceTenantContext` rejects client-supplied `x-tenant-id` mismatches |
| **Account Enumeration** | Generic `Invalid email or password` errors (never confirms email presence) |
| **Timing Attacks** | `crypto.timingSafeEqual` for all password, PIN, and OTP hash checks |

---

## 11. Audit Events

Recorded immutably in `audit_logs` via `AuditService`:
- `auth.otp_requested`
- `auth.otp_verified`
- `auth.otp_verification_failed`
- `auth.owner_registered`
- `auth.cashier_created`
- `auth.login_password_success`
- `auth.login_password_failure`
- `auth.login_pin_success`
- `auth.login_pin_failure`
- `auth.logout`
- `auth.user_sessions_revoked`
- `auth.password_updated`
- `auth.pin_updated`

---

## 12. API Endpoints

| Method | Endpoint | Description | Auth Required | Rate Limited |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/signup-otp/request` | Request 6-digit phone verification OTP | No | Yes (60s cooldown) |
| `POST` | `/api/v1/auth/signup-otp/verify` | Verify 6-digit OTP code | No | Yes |
| `POST` | `/api/v1/auth/register` | Register tenant, primary branch & owner | No (Requires verified phone) | No |
| `POST` | `/api/v1/auth/login` | Email + password login (multi-tenant aware) | No | Yes |
| `POST` | `/api/v1/auth/login-pin` | Fast-switch cashier PIN login | No | Yes |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user & tenant context | Yes (Bearer) | No |
| `POST` | `/api/v1/auth/logout` | Revoke current session token | Yes (Bearer) | No |

---

## 13. Error Behavior

Standardized JSON error envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```
Specific Error Codes:
- `VALIDATION_ERROR` (HTTP 400)
- `RESEND_COOLDOWN` (HTTP 429, includes `remainingSeconds`)
- `OTP_VERIFICATION_FAILED` (HTTP 400)
- `INCORRECT_CODE` (HTTP 400, includes `remainingAttempts`)
- `MAX_ATTEMPTS_EXCEEDED` (HTTP 400)
- `EXPIRED_CODE` (HTTP 400)
- `ALREADY_USED` (HTTP 400)
- `INVALID_CREDENTIALS` (HTTP 401)
- `INVALID_PIN` (HTTP 401)
- `UNAUTHORIZED` (HTTP 401)
- `INVALID_TOKEN` (HTTP 401)
- `FORBIDDEN` (HTTP 403)
- `TENANT_MISMATCH` (HTTP 403)
- `MULTIPLE_TENANTS_FOUND` (HTTP 409, includes array of tenant options)

---

## 14. Test Coverage

Comprehensive test coverage implemented in `tests/07_phase1_authentication.test.ts` (34 test cases) and existing suites `tests/01_app_and_routes.test.ts` through `tests/06_tax_and_devices.test.ts` (16 test cases).
**Total: 50 tests passing (0 failing).**

---

## 15. Known Limitations

- **Telecom Gateways**: Production SMS/USSD providers (Hubtel, Arkesel, Africa's Talking) will require specific production API adapters in a future deployment hardening phase. The architecture currently uses the decoupled `SandboxOtpProvider`.
- **Session Store**: Currently persisted in SQLite (`auth_sessions`). For horizontal clustering across multiple Node.js instances in future phases, Redis-backed session caching may be introduced.

---

## 16. Deferred Functionality

- Phase 2: Full Merchant Onboarding Wizard (Ghana Card KYC, Bank/MoMo settlement accounts, branch topologies).
- Phase 3: Custom Role & Granular Permission Management UI.
- Phase 4: Product Catalog & Multi-Location Inventory.
- Phase 5: Point-of-Sale (POS) Checkout & Cart Engine.
