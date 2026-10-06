---
description: SikaPOS project context, tech stack, current state, and rules.
---

# SikaPOS (Akoma Commerce Cloud) Project Context

This file contains the complete project context for SikaPOS. **As an AI agent, you must read and adhere to this context, and update this file whenever significant architectural or structural changes are made.**

## 1. Project Overview
SikaPOS (*Sika* = Gold / Money in Akan) is developed by **Mastermade Solutions**. It is an offline-resilient, multi-tenant cloud point-of-sale and retail management platform designed for speed, clarity, and ease of use across mobile and desktop devices, tailored for Ghanaian & West African SMB Retailers.

## 2. Tech Stack
- **Frontend**: React 19, React Router v7, Vite, Tailwind CSS v4, Framer Motion, Lucide React, TypeScript.
- **Backend**: Express, Better-SQLite3 (SQLite), TypeScript.
- **Styling**: Vanilla CSS / Tailwind with a custom design system based on `sikapos_design_system` and `sikapos_design_system_specification_stage_1_lock.txt`.
- **Monorepo Structure**: The frontend is in the `client/` directory and backend scripts (`server.ts`, `src/`) at the root.

## 3. Directory Structure & Key Files
- `client/src/pages/`: Contains the main application views.
- `client/src/components/ui/`: Reusable UI primitives (`Button`, `Input`, `PhoneInput`, `Modal`, `StatusBadge`, `SectionHeader`, `FormSection`, `ProgressSteps`, `ErrorState`, `Skeletons`, `Card`, `Drawer`, `PinKeypad`, `Stepper`, `Toast`).
- `client/src/components/layout/`: `AuthLayout.tsx`, `Header.tsx`, `DashboardLayout.tsx`, `Footer.tsx`.
- `client/src/components/visuals/`: `BrandLogo.tsx`, `PosTerminalMockup.tsx`, `DotPattern.tsx`, `AmbientGlow.tsx`.
- `client/src/api/`: API integration utilities (`auth.api.ts`, `pos.api.ts`, `product.api.ts`, `tenant.api.ts`).
- `client/src/lib/`: Motion presets (`motion.ts`), utilities (`utils.ts` with `formatGHS`, `cn`).
- `docs/privacy-policy-draft.md`: Ghana Act 843 compliant Privacy Policy draft (**DRAFT / PENDING REVIEW**).
- `server.ts`: Express backend entry point.
- `sikapos_design_system_specification_stage_1_lock.txt`: Master file for design tokens and component specifications.

## 4. UX & Design Architecture Overhaul (Current State)

### A. UX & Cognitive Load Principles
1. **Hick's Law**: Minimized visible choices on every screen. Primary actions are isolated; secondary and tertiary choices are moved into menus or contextual footers.
2. **Button Hierarchy**:
   - **Level 1 (Primary)**: Exactly one dominant CTA per screen (e.g. `Create Account & Verify Phone`, `Charge GH₵ 103.20`).
   - **Level 2 (Secondary)**: One or two alternatives (e.g., `Back`, `Sign In`).
   - **Level 3 (Tertiary)**: Low-emphasis text links and skip options.
3. **Von Restorff (Isolation) Effect**: Dominant tasks stand apart visually. Emerald buttons are reserved for primary calls to action.
4. **Law of Proximity**: Fields are organized into semantic chunks (`Your Details`, `Your Business`, `Security`) using typography, alignment, and spacing rather than heavy card borders or harsh divider lines.
5. **Miller's Law (Chunking)**: Onboarding flows use linear 4-step progress (`Register` → `Store Setup` → `Terminal Readiness` → `POS`) with the active step visually dominant.
6. **Tangible Copy**: Decorative buzzwords and redundant status badges removed. Direct, informative language throughout.

### B. Visual Design System
1. **Brand Identity**:
   - SikaPOS Emerald: `#0D5C3A` (Hover `#09432A`, Active `#062F1D`, Subtle `#E8F5EE`).
   - Sika Gold/Amber: `#D97706` (Hover `#B45309`, Subtle `#FEF3C7`).
   - Canvas: `#F8FAFC`, Surface: `#FFFFFF`, Input: `#F1F5F9`, Border: `#E2E8F0`.
2. **Texture & Atmosphere**: Controlled radial dot textures (`bg-dot-pattern`, `0.35` opacity) and subtle ambient glows (`AmbientGlow`) for editorial depth without visual clutter.
3. **Glassmorphism**: Controlled glass panels (`.glass-panel`) with subtle 1px translucent borders (`border-slate-200/80`).
4. **Typography**: Plus Jakarta Sans, tabular numerical figures (`tabular-nums`) for currency amounts, quantities, and timers.
5. **Icon System**: Lucide React strictly, with standardized sizes (16px compact, 18px standard, 20px primary controls, 24px hero context).
6. **Currency Standardization**: Strict format `GH₵ X,XXX.XX` with comma-separated thousands via centralized `formatGHS()` utility.

### C. Reusable UI Primitives (`client/src/components/ui/`)
- `StatusBadge`: Unified status pill with icon + label + semantic color (active/synced, pending/momo, failed/void, offline).
- `SectionHeader`: Clean typography-driven grouping header.
- `FormSection`: Proximity-based form container without heavy card borders.
- `ProgressSteps`: Linear onboarding step indicator for distraction-free registration.
- `ErrorState`: Accessible, recoverable error boundary view.
- `Skeletons`: Shape-matching loaders (`ProductGridSkeleton`, `KPICardSkeleton`, `TableSkeleton`, `POSCartItemSkeleton`).
- `Button`: Enforces Level 1–3 hierarchy with automatic `loadingText`, `aria-busy`, and touch ergonomics (min 48px/52px).
- `Input` & `PhoneInput`: WCAG 2.2 AA compliant with `aria-invalid`, `aria-describedby`, error `role="alert"`, and visible focus rings.
- `Modal`: Accessible dialog with `aria-labelledby`, `aria-describedby`, keyboard `Escape`, and mobile bottom-sheet ergonomics.

### D. Accessibility & Ergonomics (WCAG 2.2 AA)
- High contrast: Slate 900 on white (15.8:1 AAA), Brand Emerald on white (7.1:1 AAA).
- Visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#0D5C3A]`).
- Screen reader accessibility: Explicit label associations, error announcements, dialog labels.
- Motion safety: All CSS and motion components strictly respect `@media (prefers-reduced-motion: reduce)`.
- Mobile touch targets: Minimum 48px input height, 52px–56px checkout buttons.

### E. Privacy Policy & Compliance
- **Location**: `docs/privacy-policy-draft.md`
- **Status**: **DRAFT — AWAITING STAKEHOLDER REVIEW**.
- **Scope**: Audited against the active codebase data model (merchants, branches, cashiers with PINs, products, cash/momo/card sales, audit logs, devices, and OTP verification) in strict alignment with Ghana Data Protection Act, 2012 (Act 843) and DPC principles.
- **Rule**: Not published or linked in production navigation until legal review gate is passed.

## 5. Agent Instructions (CRITICAL)
- **Always update this file** whenever a new page, major component, backend route, or new tech stack dependency is added.
- **Maintain Premium Design Restraint**: Beauty comes from hierarchy, consistency, restraint, composition, spacing, and typography—not from adding more decorative UI elements.
- **Component Reusability**: Use the established primitives (`StatusBadge`, `FormSection`, `Button`, `Skeletons`, etc.).
- **Preserve Backend & Architecture**: Do not break Express endpoints, SQLite schema, multi-tenant isolation, or auth services.
