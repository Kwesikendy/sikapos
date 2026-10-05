---
description: SikaPOS project context, tech stack, current state, and rules.
---

# SikaPOS (Akoma Commerce Cloud) Project Context

This file contains the complete project context for SikaPOS. **As an AI agent, you must read and adhere to this context, and update this file whenever significant architectural or structural changes are made.**

## 1. Project Overview
SikaPOS (*Sika* = Gold / Money in Akan) is an offline-resilient, multi-tenant cloud point-of-sale and retail management platform designed for speed, clarity, and ease of use across mobile and desktop devices, tailored for Ghanaian & West African SMB Retailers.

## 2. Tech Stack
- **Frontend**: React 19, React Router v7, Vite, Tailwind CSS v4, Framer Motion, Lucide React, TypeScript.
- **Backend**: Express, Better-SQLite3 (SQLite), TypeScript.
- **Styling**: Vanilla CSS / Tailwind with a custom design system based on `sikapos_design_system`.
- **Monorepo Structure**: The frontend is in the `client/` directory and backend scripts (`server.ts`) at the root.

## 3. Directory Structure & Key Files
- `client/src/pages/`: Contains the main application views.
- `client/src/components/`: Reusable UI components (e.g., Stepper, forms).
- `client/src/api/`: API integration utilities.
- `client/src/types/`: TypeScript definitions.
- `client/src/lib/`: Utility functions (e.g., `utils.ts` for clsx/tailwind-merge).
- `server.ts`: Express backend entry point.
- `sikapos_design_system_specification_stage_1_lock.txt`: Master file for design tokens and component specifications.

## 4. Implemented Features & UI/UX Design (Current State)
We have successfully completed a comprehensive UI/UX overhaul (inspired by premium SaaS aesthetics like Moondoog and Haynes Consult) using heavy glassmorphism, depth layers, and staggered Framer Motion entrances.

### Pages & Routes
1. **Merchant Signup (`/merchant-signup`)**: Merchant onboarding and registration interface using a 2-column premium glass layout.
2. **Business & Store Setup (`/store-setup`)**: Multi-step business profile wizard with progressive disclosure and smooth step transitions.
3. **Launch Readiness (`/launch-readiness`)**: Terminal readiness checklist using a Dual Bento Grid layout and prominent call-to-actions.
4. **Cashier PIN Login (`/cashier-login`)**: Rapid PIN pad authentication and fast-switch tab interface.
5. **Dashboard Shell (`/dashboard`)**: A 3-column architecture application shell (`DashboardLayout.tsx`) featuring a collapsible glass sidebar and global search header. Includes `DashboardHomePage.tsx` displaying KPI cards and data visualization placeholders with skeleton loading states.
6. **Point of Sale (`/pos`)**: High-velocity split-pane POS interface (`POSPage.tsx`) with a mobile slide-out cart drawer, persistent desktop cart sidebar, categories, and haptic-like product tap interactions with skeleton loading states.

### Core UI Component Library (`client/src/components/ui/`)
- **Base Primitives**: `Button`, `Input`, `Card`, `Badge` (with `online/offline/amber` pulsing variants), `PinKeypad`, `Stepper`.
- **Layout & Feedback**: `Drawer` (slide-out panel), `Toast` / `Toaster` (with `useToast` hook), `Skeleton` (Framer motion pulse loaders), `EmptyState` (glassmorphic empty views).

## 5. Agent Instructions (CRITICAL)
- **Always update this file** whenever a new page, major component, backend route, or new tech stack dependency is added. 
- **Maintain Premium Design Aesthetics**: Strictly follow the established `sikapos_design_system_specification_stage_1_lock.txt`. Use the `.glass-panel` and `.glass-overlay` paradigms. Always use `clsx` and `tailwind-merge` (`cn` utility) for conditional classes. Ensure high-quality, modern animations via `Framer Motion` (centralized in `client/src/lib/motion.ts`).
- **Component Reusability**: Do not duplicate UI logic. Use the unified UI library (`Badge`, `Card`, `Skeleton`, etc.).
- **Write resilient code**: Consider offline-resilient capabilities and strict tabular formatting for numbers (`tabular-nums`).
