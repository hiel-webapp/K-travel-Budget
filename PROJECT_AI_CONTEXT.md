# PROJECT_AI_CONTEXT.md - HypeHeritage (K-travel Budget Planner) Full AI Context & Specification

> **Notice for AI Models / LLMs**: This document serves as the complete, authoritative knowledge base for the **HypeHeritage (K-travel Budget Planner)** repository. Use this specification to understand the codebase architecture, domain logic, data models, financial invariants, and implementation guidelines.

---

## 1. Project Summary & Core Mission

### 1.1 Mission
HypeHeritage is a trustworthy, multilingual, high-performance Korea travel budget planner designed specifically for international travelers. It enables users to:
1. Input trip conditions with minimal friction (length of stay, number of travelers, selected cities, budget style).
2. Generate an accurate, realistic Korea travel budget without searching through hundreds of individual hotels/restaurants.
3. Plan accommodation, meals, transportation, attractions, and emergency funds.
4. Inspect dynamic city-based **Smart Receipts** with precise pricing units and freshness metadata.
5. Explore actual candidates, official reservation links, and local order guides without breaking budget transparency.
6. Access **Free Basic Reports** and preview **Paid One-Stop Premium Reports**.

### 1.2 Core Product Philosophy
> **"Plan by type first. Choose a specific place later."**

Initial budget estimation is powered by **Budget Baskets** (representative price ranges by tier/category) rather than hardcoded individual businesses. Specific place selections or food wishlists refine or replace pre-calculated budget slots cleanly without double-counting.

---

## 2. Technical Stack & System Architecture

### 2.1 Technology Stack
- **Framework**: Next.js 16.2.10 (App Router)
- **UI Library**: React 19.2.4
- **Language**: TypeScript 5.x (Strict Mode enabled)
- **Styling**: Tailwind CSS 4.x
- **Testing**: Vitest 4.x (Unit & Domain Logic Tests)
- **Build & Adapter**: `@opennextjs/cloudflare` & `wrangler` (Cloudflare Pages deployment target)
- **Database/Auth**: Supabase (Prepared / Mock catalog state in MVP phase)

### 2.2 Directory Structure & Layer Separation
```
c:\Users\TEST\Desktop\K-travel Budget\
├── docs/                        # Architecture & decision markdown documents
├── public/                      # Static assets
├── src/
│   ├── app/
│   │   └── [locale]/            # Localized App Router (ko, en)
│   │       ├── page.tsx         # Minimal Landing (Mad-libs Form)
│   │       ├── planner/         # Interactive Budget Planner & Smart Receipt
│   │       ├── report/          # Free Basic Report & Paid One-Stop Preview
│   │       ├── trend/           # K-Trend discovery page
│   │       ├── guide/           # K-Guide practical handbook page
│   │       ├── places/          # Place candidate exploration page
│   │       └── saved-trips/     # Saved trip history management
│   ├── components/              # Pure presentation & UI components
│   │   ├── Header.tsx           # Global Header (72px fixed, 3-column layout)
│   │   ├── Footer.tsx           # Global Footer
│   │   ├── LandingForm.tsx      # Mad-libs sentence input form
│   │   ├── PlannerContent.tsx   # Budget workspace & Smart Receipt viewer
│   │   ├── FoodPlannerPanel.tsx # Food meal-slot replacement & add-on panel
│   │   ├── ReportContent.tsx    # Report view component
│   │   └── ...
│   ├── features/
│   │   └── budget/              # Isolated Budget Domain Feature
│   │       ├── domain/          # Pure TypeScript types & interfaces
│   │       ├── catalog/         # Budget Baskets & Mock Price Catalogs
│   │       ├── calculations/    # Pure calculation engine & invariants (`engine.ts`, `food-engine.ts`)
│   │       └── presentation/    # Feature-specific UI components
│   └── lib/
│       ├── trip-domain.ts       # TripDraft model & validation
│       ├── storage-helper.ts    # Envelope versioned localStorage management
│       └── i18n/                # Localization resources & dictionaries
```

---

## 3. Core Data Models & TypeScript Specifications

### 3.1 TripDraft (User Input Model)
```typescript
export type SupportedCity = "SEOUL" | "BUSAN";
export type BudgetTier = "BUDGET" | "STANDARD" | "PREMIUM";

export interface TripDraft {
  totalNights: number;              // Range: 1 to 14 (Default: 5)
  adultCount: number;               // Range: 1 to 4 (Default: 2)
  selectedCities: SupportedCity[]; // Non-empty array, e.g. ["SEOUL", "BUSAN"]
  cityNightAllocations: Record<SupportedCity, number>; // Sum must equal totalNights
  budgetTier: BudgetTier;           // "BUDGET" | "STANDARD" | "PREMIUM"
  targetBudgetKrw: number;          // Default: 3,000,000 KRW
}
```

### 3.2 Budget Line Item & Pricing Units
Supported pricing units for budget line items:
- `ROOM_NIGHT`: Price calculated per room per night.
- `PERSON_DAY`: Price calculated per traveler per day.
- `PERSON_MEAL`: Price calculated per meal per person.
- `PERSON_ONE_WAY`: Intercity transport (e.g. KTX ticket per person).
- `PER_PERSON`: General per-person cost.
- `FIXED_AMOUNT`: Fixed single charge (e.g. Emergency Fund).

```typescript
export type BudgetCategory = 
  | "ACCOMMODATION" 
  | "FOOD" 
  | "CITY_TRANSPORT" 
  | "INTERCITY_TRANSPORT" 
  | "ATTRACTION" 
  | "EMERGENCY_FUND";

export interface BudgetLineItem {
  id: string;                       // Stable ID (e.g., "SEOUL_ACCOMMODATION_STANDARD")
  basketId: string;
  category: BudgetCategory;
  scope: "CITY" | "INTERCITY" | "TRIP_WIDE";
  cityCode: SupportedCity | null;
  route: string | null;            // e.g., "SEOUL-BUSAN"
  unitPriceKrw: number;            // Single unit cost in KRW
  pricingUnit: PricingUnit;
  quantity: number;
  participantCount: number;
  durationCount: number;
  lineTotalKrw: number;            // Final calculated KRW amount
  priceMinKrw: number;
  priceMaxKrw: number;
  confidence: "MOCK" | "VERIFIED" | "PARTIAL";
  updatedAt: string;
  sourceLabel: string;
  mealPlan?: DetailedMealPlan;
}
```

### 3.3 Food Planning: Base Meal Slot & Replacement Domain
Food budget is calculated using 3 layers:
1. **Base Meal Plan**: Automatically populated meal slots (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK_CAFE`) based on trip length and budget tier. Note: `SNACK_CAFE` is excluded from the default base meal sum.
2. **Food Replacements**: When a user selects a specific menu item from wishlist collections, it **replaces** 1 matching Base Meal slot (default 1:1 replacement rule), preventing budget double-counting.
3. **Food Add-ons**: Optional side dishes or beverages chosen by the user.

---

## 4. Core Calculation Engine & Financial Invariants

The budget engine (`src/features/budget/calculations/engine.ts`) is a pure, side-effect-free function.

### 4.1 Financial Invariants (Strict Business Rules)
1. **Grand Total Invariant**:
   $$\text{GrandTotal} = \sum \text{CitySubtotals} + \text{IntercitySubtotal} + \text{TripWideSubtotal}$$
   All line totals must strictly sum to the Grand Total without rounding discrepancy.
2. **Category Totals Invariant**:
   $$\text{GrandTotal} = \sum \text{CategoryTotals}$$
3. **Flight Cost Exclusion Rule**:
   - **Flight costs (`flightCost`) are strictly EXCLUDED** from the Korea travel budget calculation.
   - The planner focuses purely on in-country expenses (stay, food, local transport, experiences, emergency).
4. **Food Replacement Invariant**:
   $$\text{Total Dinner Slots} = \text{Remaining Base Dinners} + \text{Custom Replaced Dinners}$$
   Selecting a custom food item replaces an existing base slot rather than adding to it.

---

## 5. User Journey & Feature Milestones

1. **Landing Page (`/[locale]`)**:
   - Renders a clean Mad-libs input sentence: *"I'm planning a 5-night trip for 2 adults to Seoul and Busan with a Standard budget."*
   - Sentence grammar and labels remain **fixed in English** across all locales, while editable fields present dynamic selectors.
2. **Planner Page (`/[locale]/planner`)**:
   - Displays real-time Budget Baskets for Accommodation, Food, Transport, Attraction, Emergency Fund.
   - Renders the interactive **Smart Receipt** with target budget usage bar, daily average, per-person cost, and city subtotals.
   - Allows customization of city stay tiers, attraction spot bundles, food wishlist replacements, and emergency fund manual inputs.
3. **Report Page (`/[locale]/report`)**:
   - **Free Basic Report**: Grand total, daily average, city subtotals, category breakdown, basic Smart Receipt summary.
   - **Paid One-Stop Report Preview**: Teases premium features (Budget Health Check, Hidden Cost Analysis, Local Order Guides, Real-time Price Fluctuations, Hotel Match Candidates).
4. **K-Trend (`/[locale]/trend`) & K-Guide (`/[locale]/guide`)**:
   - Contextual guides for K-Food, travel etiquette, emergency contact numbers (Police 112, Ambulance 119, Tourist Info 1330), transit cards, and payment customs.

---

## 6. Guidelines for Other AI Coding Assistants

When modifying or expanding this codebase, any AI assistant MUST adhere to the following rules:

1. **Keep Pure Calculations Isolated**:
   - Never mix React hooks, Supabase clients, or DOM APIs inside `src/features/budget/calculations/`. Domain calculations must remain 100% pure functions suitable for unit testing with Vitest.
2. **Preserve Financial Invariants**:
   - Always verify that line item sums match section subtotals and the grand total.
   - Never re-introduce flight costs into the budget plan.
3. **Maintain Type Safety**:
   - Avoid `any` types. Strictly enforce TypeScript interfaces in `src/features/budget/domain/types.ts` and `src/lib/trip-domain.ts`.
4. **Localization Rules**:
   - Keep visible copy inside translation dictionaries (`src/lib/i18n/dictionaries/ko.ts` and `en.ts`).
   - Do NOT translate fixed domain terms (HypeHeritage, K-트렌드, K-가이드, KTX, eSIM) or the Landing Mad-libs sentence structure.
5. **UI & Design System**:
   - Use warm off-white backgrounds (`#faf9f6`), white card containers, deep navy text (`#0f172a`), muted coral red accents, and sage green status indicators.
   - Follow the permanent Header layout (72px fixed height, 3-column viewport absolute center navigation).

---
*Generated by HypeHeritage Development Agent for AI Context & Learning Sync.*
