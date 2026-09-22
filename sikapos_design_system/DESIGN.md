---
name: SikaPOS Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#404942'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707971'
  outline-variant: '#bfc9c0'
  surface-tint: '#226b47'
  primary: '#004328'
  on-primary: '#ffffff'
  primary-container: '#0d5c3a'
  on-primary-container: '#8ad2a7'
  inverse-primary: '#8ed6aa'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#003d5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#005582'
  on-tertiary-container: '#8bc9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a9f3c5'
  primary-fixed-dim: '#8ed6aa'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#005232'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-numeric-lg:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  label-numeric-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  label-numeric-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system defines a high-velocity, resilient retail operating OS and point-of-sale platform tailored for West African commerce—spanning busy neighborhood marts, community pharmacies, fashion boutiques, and bustling open-air eateries. 

### Brand Personality & Emotional Impact
- **Prosperity & Trust:** Grounded in rich agricultural and financial emeralds, evoking longevity, cash security, and business growth.
- **Warm Commerce & Vibrancy:** Accented by warm amber golds inspired by Ghanaian kente gold and marketplace dynamism, providing energetic focal points for transactions.
- **Industrial Reliability:** Built for rapid high-cadence checkout, noisy environments, glare-heavy sunlight, and intermittent network conditions. It instills unwavering confidence in the cashier and merchant.

### Design Style: Tactile Modern Commerce
The visual design combines clean structural layouts with physical tactile feedback:
- **High legibility under glare:** High-contrast neutral slates against crisp surfaces, maintaining WCAG AAA ratings for prices and order actions.
- **Thumb-driven touch targets:** Designed with a minimum 48px baseline (expanding to 52px+ on primary checkout actions) to prevent mis-taps during rush-hour queues.
- **Physicality and Affirmation:** Clear state borders, tactile button depressions, and unmistakable payment method badges (specifically tuned for West African mobile money and cash rails).

## Colors

The color system is engineered for unambiguous financial clarity, fast optical recognition in sunlit retail stalls, and native support for regional transaction modalities.

### Core Brand Tokens
- **Primary (`#0D5C3A` - Forest Emerald):** The foundational brand color for authoritative elements, major completion buttons ("Charge GH₵", "Complete Sale"), active selection rings, and core navigation.
- **Secondary (`#D97706` - Sun Amber):** Used for transactional highlights, discounts, pending balance alerts, loyalty incentives, and active cart callouts.
- **Tertiary (`#0284C7` - Clearing Sky):** Dedicated to technical utilities, Bluetooth printer status, barcode scanner connectivity, and informational sync banners.
- **Neutral (`#0F172A` - Rich Slate):** The primary text and edge tone, providing significantly deeper contrast and less glare than pure harsh black.

### Regional Telco & Payment Rail Semantic Tokens
Payment selection cards and badges must strictly map to authentic payment provider visual tokens to allow instant customer and operator identification:
- **MTN MoMo:** Surface `#FEF9C3`, Border `#FDE047`, Accent/Icon `#EAB308` (Fallback Gold: `#CA8A04`).
- **Telecel Cash:** Surface `#FEF2F2`, Border `#FECACA`, Accent/Icon `#E60000`.
- **AT Money:** Surface `#EFF6FF`, Border `#BFDBFE`, Accent/Icon `#2563EB`.
- **Physical Cash:** Surface `#ECFDF5`, Border `#A7F3D0`, Accent/Icon `#059669`.
- **Bank Card / QR:** Surface `#F8FAFC`, Border `#E2E8F0`, Accent/Icon `#475569`.

### Operational Status Tokens
- **Offline Mode:** Surface `#FFFBEB`, Border `#FCD34D`, Text `#B45309`, Icon `#D97706`.
- **Synchronized / Live:** Surface `#F0FDF4`, Border `#BBF7D0`, Text `#15803D`, Indicator `#22C55E`.
- **Stock Depleted / Error:** Surface `#FEF2F2`, Border `#FCA5A5`, Text `#991B1B`.
- **Low Stock Warning:** Surface `#FFFBEB`, Border `#FDE68A`, Text `#92400E`.

### Surface Architecture
- App Canvas Background: `#F8FAFC` (Slate 50).
- Card / Panel Elevated Surface: `#FFFFFF` (Pure White).
- Modal / Bottom Sheet Surface: `#FFFFFF`.
- Input & Inactive Card Fill: `#F1F5F9` (Slate 100).
- Ghost Borders & Separators: `#E2E8F0` (Slate 200).
- High-Stress Surface Outlines: `#CBD5E1` (Slate 300).

## Typography

The typographical hierarchy is engineered for lightning-fast readability and zero data-entry ambiguity.

### Font Roles
- **Primary Interface (`Plus Jakarta Sans`):** Delivers clean geometry, open counters, and high legibility across low-cost Android POS terminals and tablets.
- **Monospaced Data & Currency (`JetBrains Mono`):** Applied strictly to tabular numbers, currency amounts (GH₵ / GHS), SKU IDs, receipt invoice numbers, stock counts, and numeric touch keypads. This prevents column shifting during live cart recalculations.

### Currency Formatting Rules
- Always render the Ghana Cedi symbol (`GH₵`) with consistent spacing: `GH₵ 145.00`.
- The currency prefix uses medium weight, while the integer and decimal amount use bold monospaced figures.
- Micro metadata (batch numbers, timestamps) renders in `label-caps` with uppercase transformation and intentional tracking to preserve clarity on thermal print simulations.

## Layout & Spacing

The layout is built around an uncompromising 4px spatial increment, structured to serve three primary POS topologies:

### Device Topologies & Breakpoints
1. **Compact Mobile Handheld (360px – 599px):**
   - Single-column flow with full-width sticky footer action bars (`height: 64px`).
   - Split views (Catalog vs. Cart) toggle via persistent bottom tabs or floating cart counters.
   - Quick-add grid: 2 columns with `space-sm` gaps for comfortable single-thumb scanning.
2. **Tablet POS Stand / Countertop (600px – 1023px):**
   - Dual-pane layout: 60% Left Pane (Category tabs + Product Catalog Grid), 40% Right Pane (Live Cart, Customer selector, Payment breakdown).
   - Sticky summary ticket panel permanently visible without modal interruptions.
3. **Desktop & Back-Office Web (1024px+):**
   - 12-column responsive fluid grid with 240px collapsible side navigation.
   - Inventory, batch edits, supplier POs, and multi-store analytics displayed in high-density data tables.

### Layout Guardrails
- **The Golden Thumb Zone:** All primary triggers on mobile (e.g., "Add Custom Amount", "Pay GH₵", "Barcode Scan Trigger") must sit within the lower 35% of the viewport height.
- **Zero Scroll Checkout:** On tablet counter stands, the active cart and settlement keypad must fit strictly within 100vh to prevent cashiers needing to scroll while serving an in-person line.

## Elevation & Depth

In bright storefronts, subtle shadows vanish. This design system pairs soft ambient occlusion with crisp boundary borders to create definitive layering.

### Surface Tiers & Shadows
- **Level 0 (Flat Base):** Background `#F8FAFC`. Zero elevation, zero shadow.
- **Level 1 (Card & Keypad Surface):** Solid `#FFFFFF` enclosed by a 1px border of `#E2E8F0` and `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05)`. Used for catalog tiles, list rows, and calculator keys.
- **Level 2 (Popovers, Sticky Action Bars, Dropdowns):** `#FFFFFF` with `box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Bottom Sheets & Slide Drawers):** High-priority execution layers with `box-shadow: 0 -8px 24px -4px rgba(15, 23, 42, 0.12)` over a 40% opacity slate backdrop (`rgba(15, 23, 42, 0.4)`).
- **Active Tactile Depress:** Interactive buttons and touch keypad buttons transition on `:active` to `transform: scale(0.98)` with shadow collapse, providing instant physical reassurance of input.

## Shapes

The geometric identity balances modern approachable software with industrial durability:
- **Rounded Level 2 Baseline:** Standard container elements use `0.5rem` (8px) to `0.75rem` (12px) corners. This keeps touch surfaces distinct and prevents visually muddy overlaps in high-density catalog grids.
- **Full Radius Pills (`rounded-full` / `9999px`):** Reserved strictly for dynamic status badges (Paid, Pending, Low Stock, Offline Synced) and quick-filter category chips.
- **Keypad Buttons:** Squared-rounded tiles (`10px` radius) to maximize the effective capacitive touch zone right up to the boundary edge.

## Components

### 1. Action Buttons
- **Primary Transaction Button:**
  - Height: `52px` (Mobile) / `48px` (Tablet/Desktop).
  - Background: Forest Emerald (`#0D5C3A`), Text: `#FFFFFF` (Semibold), Radius: `12px`.
  - Icon: Right-aligned chevron or currency mark. Includes subtle inner top highlight border (`rgba(255, 255, 255, 0.15)`) for tactile depth.
- **Secondary Action Button:**
  - Height: `44px`. Background: `#FFFFFF`, Border: `1.5px solid #CBD5E1`, Text: Slate 900 (`#0F172A`).
- **Numpad Digit Button:**
  - Minimum dimensions: `64px` height by `100%` column width.
  - Background: `#FFFFFF`, Border: `1px solid #E2E8F0`, Text: `label-numeric-lg` Slate 900.
  - Active state: Background turns `#F1F5F9`.

### 2. Product Quick-Add Card
- Layout: Vertical card with top product image (aspect ratio 4:3) or vibrant fallback monogram badge.
- Surface: `#FFFFFF`, Border: `1px solid #E2E8F0`, Radius: `12px`.
- Typography: Product Title in `body-md` (truncated to 2 lines max); Price in `label-numeric-md` with `#0D5C3A` green coloring.
- Inventory Indicator: Bottom edge tiny pill (`3px` height bar or micro pill) showing remaining quantity. Turns `#DC2626` when stock $\le$ 3 units.

### 3. Payment Method Selector Cards
- Grid: 2x2 or 4-column row.
- Structure: Centered telco/bank logo or monochrome icon, bold channel name (e.g., "MTN MoMo", "Telecel", "Cash", "Card"), radio indicator.
- Selected State: Active border `2px solid #0D5C3A`, background `#F0FDF4`.

### 4. Input Fields & Barcode Scan Fields
- Height: `48px`.
- Inactive: Background `#F8FAFC`, Border `1px solid #CBD5E1`, Radius `10px`.
- Focused: Background `#FFFFFF`, Border `2px solid #0D5C3A`, zero ambient outline blur.
- Prefix / Suffix: Integrated quick-action button for camera barcode trigger or "Clear (X)" button.

### 5. Status Badges & Offline Sync Indicator
- Shape: `rounded-full`, padding `4px 10px`, typography `label-caps`.
- **Offline Unsynced Pill:** Amber background `#FEF3C7`, Text `#92400E`, with pulsing dot indicating local transactions held in device storage.
- **Synced / Live Cloud Pill:** Emerald background `#DCFCE7`, Text `#166534`, static checkmark icon.

### 6. Mobile Bottom Sheet (Cart & Settlement)
- Drag Handle: `36px` width, `4px` height, `#CBD5E1` center-aligned at top.
- Header: Cart item count with total price pinned in bold monospaced digits.
- Footprint: Fixed at bottom with full width touch triggers to finalize transaction or initiate customer phone prompt for USSD MoMo push.