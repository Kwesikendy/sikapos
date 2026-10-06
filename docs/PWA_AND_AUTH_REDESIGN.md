# SikaPOS Modern SaaS Auth Redesign & PWA Implementation Architecture

## 1. Overview & Visual Identity
SikaPOS / Akoma Commerce Cloud authentication was transformed from a static, conventional entry screen into a modern, tactile, premium SaaS experience tailored for Ghanaian commercial commerce. The visual language blends:
- **SikaPOS Brand Heritage**: Forest Emerald (`#0D5C3A`), Ghanaian Gold/Amber (`#D97706`), crisp Slate Canvas (`#F8FAFC`), and clean Surface White (`#FFFFFF`).
- **Haynes Consult Influence**: Layered atmospheric depth, floating frosted-glass surfaces (`backdrop-filter: blur(18px)`), refined micro-interactions, and visual breathing room.
- **Moondoog Technical Rigor**: Dual-strata living animated dot network giving an ambient sense of life without distracting visual noise or heavy DOM animations.

---

## 2. Atmospheric Layered Background (`AnimatedBackground.tsx`)
Constructed using 4 performant visual layers:
1. **Layer 1 (Canvas)**: Solid, high-legibility base in `#F8FAFC`.
2. **Layer 2 (Dual Strata Dot Network)**:
   - Primary Strata: Radial gradient dot grid (24px grid, 1.25px radius) translating slowly on a 60s loop (`@keyframes sikaDotDriftPrimary`).
   - Secondary Strata: Complementary dot grid (36px grid, 1px radius) drifting counter-directionally on an 85s loop (`@keyframes sikaDotDriftSecondary`).
   - Hardware accelerated (`will-change: transform`, `pointer-events-none`).
3. **Layer 3 (Emerald Focal Depth)**: Soft radial glow (`rgba(13, 92, 58, 0.05)`) positioned behind the authentication card to ground the form without blowing out contrast.
4. **Layer 4 (Corner Ambience)**: Warm amber gradient in top-right and emerald glow in bottom-left at ultra-low opacity (< 4%).
5. **Reduced Motion**: Full `@media (prefers-reduced-motion: reduce)` support freezing keyframe translation while preserving the calm dot pattern.

---

## 3. Floating Glass Navigation (`AppNavbar.tsx`)
- **Desktop**: Floating pill positioned with top breathing room (`max-w-6xl mx-auto mt-4 px-6`), `backdrop-blur-xl bg-white/75`, fine border (`border-slate-200/60`), and subtle soft shadow (`shadow-sm`).
- **Brand Identity**: Features the SikaPOS emblem with gold checkmark badge, "SikaPOS" wordmark, and "AKOMA COMMERCE CLOUD" micro-subtitle.
- **Navigation Links**: Quick access to "Dashboard" and "Point of Sale" terminal.
- **Mobile Experience**: Responsive breakpoint (`sm:hidden`) transforming into a clean header with accessible hamburger button and an animated slide-down frosted glass sheet drawer with keyboard focus and touch targets >= 44px.

---

## 4. Reusable Network Status System (`NetworkStatus.tsx`)
- **Hook**: `useNetworkStatus()` tracks live browser online/offline status, listens to connectivity events, and allows programmatic status override.
- **States**:
  - `Online`: Emerald dot (`bg-emerald-500`) with emerald badge.
  - `Offline`: Rose red dot (`bg-rose-500`) with red warning badge.
  - `Reconnecting`: Amber pulse dot (`bg-amber-500 animate-pulse`).
  - `Syncing`: Sky blue spin indicator (`text-sky-500 animate-spin`).
- **Accessibility**: Includes `role="status"` and `aria-live="polite"`.

---

## 5. Refined Authentication System (`LoginPage.tsx` & Auth Components)
- **Component Architecture**:
  - `AuthCard`: Glassmorphic container (`bg-white/85 backdrop-blur-2xl rounded-3xl border-slate-200/80 shadow-xl`) with visual hierarchy (Brand Badge -> Heading -> Description -> Form -> Security Footer).
  - `AuthMethodSwitcher`: Segmented control switching between "Owner / Manager" and "Cashier PIN", utilizing Framer Motion's `layoutId="activeAuthIndicator"` for a smooth sliding white pill.
  - `AuthInput`: 46px height inputs with neutral background (`bg-slate-50/80`), emerald focus rings (`focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]`), comfortable touch targets, and password eye toggles.
  - `AuthSubmitButton`: Emerald CTA (`bg-[#0D5C3A] hover:bg-[#09432A]`) with subtle hover arrow translation (`group-hover:translate-x-1.5`) and accessible loading spinner.
  - `AuthError`: Smooth non-jarring slide-down alert (`bg-rose-50 border-rose-200/80 text-rose-700`) with actionable quick links.
- **Multi-tenant & Security**:
  - Multi-tenant ambiguity resolver modal allowing merchants with multiple registered stores to select their intended workspace.
  - Cashier PIN direct till access mode.
  - Google OAuth single-click authentication.
  - Phone OTP verification fallback via Moolre SMS gateway.

---

## 6. Progressive Web App (PWA) Implementation
### Architecture & Dependencies
- Added `vite-plugin-pwa` with `generateSW` strategy.
- Configured in `client/vite.config.ts` with custom manifest and service worker caching rules.

### Web App Manifest (`manifest.webmanifest`)
- **Name**: `SikaPOS — Akoma Commerce Cloud`
- **Short Name**: `SikaPOS`
- **Theme Color**: `#0D5C3A`
- **Background Color**: `#F8FAFC`
- **Display**: `standalone`
- **Orientation**: `any`
- **Icons**:
  - `client/public/icons/icon-192.svg` (192x192)
  - `client/public/icons/icon-512.svg` (512x512)
  - `client/public/icons/maskable-512.svg` (512x512 maskable)

### Service Worker & Offline Strategy
- **Application Shell Precache**: Automatically caches HTML, compiled JavaScript, CSS, SVGs, and web fonts.
- **Strict Security & Multi-Tenancy Boundary**: POS transactional endpoints (`/api/*`), tenant data, and Firebase tokens are explicitly marked `NetworkOnly` with `navigateFallbackDenylist: [/^\/api/]`. No sensitive financial or credentials data is ever cached offline by the service worker.
- **Standalone Viewport**: Styled with `viewport-fit=cover`, `env(safe-area-inset-top)`, and `env(safe-area-inset-bottom)` to handle iOS notches and mobile status bars natively.

### Installation & Update UX
- **`InstallPrompt.tsx`**:
  - Tasteful, non-intrusive floating glass card appearing only when `beforeinstallprompt` fires or on iOS Safari.
  - Persistent 14-day dismissal window via `localStorage` to avoid nag fatigue.
  - Specific iOS Safari guidance (Share -> "Add to Home Screen").
- **`UpdatePrompt.tsx`**:
  - Monitors service worker `onNeedRefresh` events.
  - Displays a clean floating alert: *"A new version of SikaPOS is available. [Refresh to update]"*.
