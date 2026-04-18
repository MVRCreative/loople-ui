# Loople UI — Style Guide

A snapshot of the design decisions currently baked into the codebase, pulled from `app/globals.css`, `components/ui/*`, and the feature composites under `components/*` and `app/*`. Use this as the reference when adding new screens; flag anything that doesn't match before shipping.

- **Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui (new-york style, copy-in), Radix primitives, `class-variance-authority`, `lucide-react` icons, Framer-less (GSAP + `tw-animate-css` for motion), Sonner for toasts.
- **Token source of truth:** `app/globals.css` — Tailwind v4 `@theme inline` binds semantic names to CSS custom properties in `:root` and `.dark`.
- **Color system:** OKLCH. Neutrals run at **zero chroma**; the only real hue is `--primary` (blue-violet, ~262°). Chart hues add green / red / purple / gold, used only in charts.
- **Fonts:** Poppins (sans, all 9 weights), Source Serif 4 (serif, 400/500/600/700), Geist Mono. Body uses Poppins by default.

---

## 1. Color Palette

All color values live in OKLCH. Hex/RGB equivalents below are approximate (sRGB round‑trip) and only meant as a quick mental anchor. Tokens are declared twice — once in `:root` (light), once in `.dark` — and exposed to Tailwind via `@theme inline` as `--color-*`.

### 1a. Light theme (`:root`)

| Token | OKLCH | Approx. hex | Purpose |
| --- | --- | --- | --- |
| `--background` | `oklch(1 0 0)` | `#ffffff` | Page background, card base |
| `--foreground` | `oklch(0.145 0 0)` | `#252525` | Default body text |
| `--card` | `oklch(1 0 0)` | `#ffffff` | Card surface |
| `--card-foreground` | `oklch(0.145 0 0)` | `#252525` | Text on cards |
| `--popover` | `oklch(1 0 0)` | `#ffffff` | Popover / menu surface |
| `--popover-foreground` | `oklch(0.145 0 0)` | `#252525` | Popover text |
| `--primary` | `oklch(0.50 0.12 262)` | `#4a62b8` | Brand blue-violet — CTAs, links, focus ring |
| `--primary-foreground` | `oklch(1 0 0)` | `#ffffff` | Text on primary |
| `--secondary` | `oklch(0.965 0 0)` | `#f2f2f2` | Subtle button / chip fill |
| `--secondary-foreground` | `oklch(0.40 0 0)` | `#5a5a5a` | Text on secondary |
| `--muted` | `oklch(0.965 0 0)` | `#f2f2f2` | Muted surface (skeletons, tab strip) |
| `--muted-foreground` | `oklch(0.556 0 0)` | `#828282` | Secondary text, meta |
| `--accent` | `oklch(0.95 0 0)` | `#ededed` | Hover fill for neutral controls |
| `--accent-foreground` | `oklch(0.25 0 0)` | `#404040` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#d43f2a` | Error / delete |
| `--destructive-foreground` | `oklch(1 0 0)` | `#ffffff` | Text on destructive |
| `--border` | `oklch(0.922 0 0)` | `#e5e5e5` | Default 1px border |
| `--input` | `oklch(0.922 0 0)` | `#e5e5e5` | Input border |
| `--ring` | `oklch(0.55 0.14 262)` | `#5268c2` | Focus ring (primary-ish) |
| `--sidebar` | `oklch(0.978 0 0)` | `#f9f9f9` | Sidebar surface |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | `#252525` | Sidebar text |
| `--sidebar-primary` | `oklch(0.50 0.12 262)` | `#4a62b8` | Sidebar active / primary |
| `--sidebar-primary-foreground` | `oklch(1 0 0)` | `#ffffff` | Sidebar text on primary |
| `--sidebar-accent` | `oklch(0.95 0 0)` | `#ededed` | Sidebar hover fill |
| `--sidebar-accent-foreground` | `oklch(0.25 0 0)` | `#404040` | Sidebar text on hover |
| `--sidebar-border` | `oklch(0.922 0 0)` | `#e5e5e5` | Sidebar divider |
| `--sidebar-ring` | `oklch(0.55 0.14 262)` | `#5268c2` | Sidebar focus ring |

### 1b. Dark theme (`.dark`)

| Token | OKLCH | Approx. hex | Notes |
| --- | --- | --- | --- |
| `--background` | `oklch(0.13 0 0)` | `#1f1f1f` | Page base |
| `--foreground` | `oklch(0.93 0 0)` | `#ebebeb` | Body text |
| `--card` | `oklch(0.13 0 0)` | `#1f1f1f` | Card surface (same as bg) |
| `--popover` | `oklch(0.16 0 0)` | `#272727` | Elevated menus are slightly lighter |
| `--primary` | `oklch(0.60 0.16 262)` | `#5c7be0` | Primary lifts in dark mode |
| `--secondary` / `--muted` | `oklch(0.18 0 0)` | `#2d2d2d` | Subtle dark surface |
| `--accent` | `oklch(0.20 0 0)` | `#333333` | Hover fill |
| `--border` / `--input` | `oklch(0.25 0 0)` | `#404040` | 1px divider |
| `--ring` | `oklch(0.60 0.16 262)` | `#5c7be0` | Focus ring matches primary |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `#d43f2a` | Same as light |
| `--sidebar` | `oklch(0.13 0 0)` | `#1f1f1f` | Dark sidebar = dark bg |
| `--sidebar-accent` | `oklch(0.20 0 0)` | `#333333` | Sidebar hover |

### 1c. Chart accent hues

Only used inside chart components; not intended for general UI.

| Token (light / dark) | OKLCH (light) | OKLCH (dark) | Semantic |
| --- | --- | --- | --- |
| `--chart-1` | `0.55 0.14 262` | `0.65 0.16 262` | Primary blue |
| `--chart-2` | `0.60 0.16 150` | `0.65 0.16 150` | Green |
| `--chart-3` | `0.55 0.18 30` | `0.60 0.18 30` | Red-orange |
| `--chart-4` | `0.65 0.15 310` | `0.70 0.15 310` | Purple |
| `--chart-5` | `0.60 0.12 70` | `0.65 0.12 70` | Gold |

### 1d. Selection / link conventions

- Text selection: `bg-primary text-primary-foreground` (declared in `Input`).
- Inline links in body copy: `text-primary hover:underline`.
- Destructive text in menus: `text-destructive focus:text-destructive`.

---

## 2. Typography

### 2a. Font families (wired up in `app/layout.tsx`)

| CSS var | Font | Fallback |
| --- | --- | --- |
| `--font-sans` | Poppins (`--font-poppins`) | `ui-sans-serif, system-ui, sans-serif` |
| `--font-serif` | Source Serif 4 (`--font-source-serif`) | `ui-serif, Georgia, serif` |
| `--font-mono` | Geist Mono (`--font-geist-mono`) | `ui-monospace, monospace` |

- Default document font is Poppins (`body` class = `poppins.className`).
- Poppins is loaded in all nine weights (100–900). Source Serif in 400/500/600/700.

### 2b. Type scale (from Tailwind v4 defaults, used verbatim)

| Class | Size / line-height | Where it shows up |
| --- | --- | --- |
| `text-xs` | 12 / 16 | Badges, meta labels, sidebar group labels |
| `text-sm` | 14 / 20 | Default body for dense UI (forms, tables, menu items, tabs) |
| `text-base` | 16 / 24 | `Input` on small screens (`md:text-sm` down-steps on md+) |
| `text-lg` | 18 / 28 | `DialogTitle`, avatar fallback initials |
| `text-xl` | 20 / 28 | Section headings in dashboards |
| `text-2xl` | 24 / 32 | `CardTitle`, stat numerics |
| `text-3xl` / `text-4xl` | 30 / 36, 36 / 40 | Marketing-ish pages (waitlist, auth) |

### 2c. Headings vs body vs meta

- **Page / card titles:** `text-2xl font-semibold leading-none tracking-tight` (`CardTitle`).
- **Dialog titles:** `text-lg font-semibold leading-none tracking-tight`.
- **Sheet titles:** `font-semibold text-foreground` (no size — inherits surrounding `text-sm`/base).
- **Body paragraphs in feed:** `text-[15px] leading-relaxed` (post body), `text-[15px] leading-snug` for headers — bespoke size outside the Tailwind scale. See inconsistencies.
- **Muted / meta text:** `text-sm text-muted-foreground` (card descriptions, timestamps, form help).
- **Caption / badge text:** `text-xs font-semibold` (badges), `text-xs font-medium` (sidebar labels, nav badges), `text-[11px]` (debug auth badge).
- **Numerics in counters:** `tabular-nums` + `text-[13px]` in `PostActions`.

### 2d. Weights in use

`font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700). Lighter Poppins weights (100–300) and 800/900 are loaded but not currently used in components.

### 2e. Tracking / letter spacing

- `--tracking-normal: 0em` is declared but not wired into `@theme`.
- Titles use `tracking-tight`. Most UI uses default tracking.

---

## 3. Spacing & Layout

### 3a. Spacing scale

- `--spacing: 0.25rem` (4px) — Tailwind v4's spacing base unit. All `p-*`, `m-*`, `gap-*`, `space-*` utilities resolve off this.
- Common paddings:
  - Card body: `p-6`
  - Card header → content: `space-y-1.5 p-6`, content `p-6 pt-0`
  - Dialog content: `p-6 gap-4`
  - Sheet header/footer: `p-4 gap-1.5 / gap-2`
  - Sidebar sections: `p-2 gap-1` (menu), `p-2 gap-2` (header/footer), sidebar menu button `p-2`
  - Feed post: `px-4 py-3`
  - Form field rhythm: `space-y-4` to `space-y-6`
- Common gaps: `gap-1`, `gap-1.5`, `gap-2`, `gap-3`, `gap-4`, `gap-6`.

### 3b. Breakpoints (Tailwind default, plus one custom JS breakpoint)

| Name | Min width |
| --- | --- |
| `sm` | 640 px |
| `md` | 768 px |
| `lg` | 1024 px |
| `xl` | 1280 px |
| `2xl` | 1536 px |

- `useIsMobile()` hook in `hooks/use-mobile.ts` uses **`768 px`** as the mobile cutoff (matches `md`). Used by `Sidebar` for swap-to-`Sheet` behavior.

### 3c. Container / max widths

There is no single `Container` primitive. Max-widths observed by page type:

| Usage | Max width |
| --- | --- |
| Auth cards (`login`, `confirm`) | `max-w-sm` (384 px) |
| Empty-state dialogs, forgot-password, new-message composer | `max-w-md` (448 px) |
| Waitlist, `DialogContent` default | `max-w-lg` (512 px) |
| Admin detail dialogs, register flow | `max-w-xl` / `max-w-2xl` |
| Animations demo | `max-w-4xl` |
| Dashboard main column, profile | `max-w-5xl mx-auto` |
| Profile hero breakout | `mx-auto max-w-5xl px-4 sm:px-6 lg:px-8` |

### 3d. Sidebar dimensions (from `components/ui/sidebar.tsx`)

- Expanded: `--sidebar-width: 16rem` (256 px).
- Icon-collapsed rail: `--sidebar-width-icon: 3rem` (48 px).
- Mobile sheet: `--sidebar-width (mobile): 18rem` (288 px).
- Menu buttons: `h-8` (default), `h-7` (sm), `h-12` (lg).
- Keyboard shortcut: **⌘/Ctrl + B** toggles the sidebar.
- State is persisted in a cookie (`sidebar_state`) for 7 days.

---

## 4. Component Patterns

### 4a. Buttons (`components/ui/button.tsx`)

Implemented with `cva`. Base: `inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all`, svg children sized to `size-4` by default.

| Variant | Styling |
| --- | --- |
| `default` | `bg-primary text-primary-foreground shadow-xs hover:bg-primary/90` |
| `destructive` | `bg-destructive text-white shadow-xs hover:bg-destructive/90` (dark-mode desaturates slightly) |
| `outline` | `border border-primary bg-background text-primary shadow-xs hover:bg-primary hover:text-primary-foreground` |
| `secondary` | `bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80` |
| `ghost` | `text-foreground hover:bg-accent hover:text-accent-foreground` |
| `link` | `text-primary underline-offset-4 hover:underline` |

| Size | Shape |
| --- | --- |
| `default` | `h-9 px-4 py-2` |
| `sm` | `h-8 rounded-md px-3 gap-1.5` |
| `lg` | `h-10 rounded-md px-6` |
| `icon` | `size-9` (square) |

States: disabled → `opacity-50 pointer-events-none`. Focus → `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`. Invalid → `aria-invalid:ring-destructive/20 aria-invalid:border-destructive`.

### 4b. Form elements

- **`Input`** (`components/ui/input.tsx`): `h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base md:text-sm shadow-xs`. Focus uses the 3px ring pattern. `placeholder:text-muted-foreground`, selection highlight in `--primary`.
- **`Textarea`**: `min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm`. Uses the older **2px ring** focus pattern — see inconsistency #4.
- **`Select`** (trigger): `h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm`. Also older 2-ring pattern. **Height mismatch with `Input`.**
- **`Label`**: standard shadcn label, inherits `text-sm font-medium`.
- **`Switch`**: `h-6 w-11` track, `h-5 w-5` thumb, `rounded-full`, `data-[state=checked]:bg-primary`.
- **Form validation:** `aria-invalid` swings border + ring to destructive. Error copy observed as both tokenized (`text-destructive`) and hard-coded (`text-red-600` + `bg-red-50`). Prefer the tokenized pattern.

### 4c. Cards & containers

- **`Card`**: `rounded-lg border border-border bg-card text-card-foreground shadow-sm`. Composed with `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`.
- **Feed post card** (`components/newsfeed/post-card.tsx`): `bg-card border-b border-border px-4 py-3` — explicitly *not* a rounded card; behaves like a Twitter-style feed row. Hover tint `hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.03]`.
- **Event card** (`components/events/EventCard.tsx`): `bg-card border-t border-l border-border p-4` — note the partial border, and non-tokenized hover (`hover:bg-gray-50`).
- **Dropdown / popover / menu surfaces**: `rounded-md border bg-popover p-1 text-popover-foreground shadow-md` (or `shadow-lg` for sub-content).

### 4d. Navigation

- **Top-level layout:** `ConditionalSidebar` chooses between sidebar + main or bare chrome per route.
- **App sidebar (`components/app-sidebar.tsx`)**: sections of `SidebarGroup` → `SidebarMenu` → `SidebarMenuButton`. Active row = `data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground`. One hard-coded primary button near the top uses raw `bg-blue-500 text-white` (should be `bg-primary`).
- **Admin sidebar (`components/admin/admin-sidebar.tsx`)**: same token set, `text-sm/6 font-semibold` rows.
- **Tabs (`components/ui/tabs.tsx`)**: `TabsList` is `h-10 rounded-md bg-muted p-1`; triggers `px-3 py-1.5 text-sm font-medium`, active = `bg-background text-foreground shadow-sm`.
- **Breadcrumb**: `gap-1.5 sm:gap-2.5 text-sm text-muted-foreground`, chevron separator `size-3.5`.
- **Tooltip**: `bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs` with a 2.5px arrow. Default delay = 0.

### 4e. Modals & overlays

- **`Dialog` overlay**: `fixed inset-0 z-50 bg-black/50` with `animate-in/out fade-in-0/fade-out-0`.
- **`Dialog` content**: `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg` plus zoom-in/out animations. Close button sits absolute `right-4 top-4 size-4`.
- **`AlertDialog`**: same sizing as `Dialog` but static action buttons.
- **`Sheet`**: full-height drawer; `w-3/4 sm:max-w-sm` on left/right, auto-height on top/bottom. Motion: `data-[state=closed]:duration-300 data-[state=open]:duration-500` slide-in/out.
- **`Popover`** / **`DropdownMenu`** / **`Tooltip`**: portal-based, z-50, origin-aware fade + zoom animations (see §6).

---

## 5. Borders & Shadows

### 5a. Border radius

| Token | Value | Notes |
| --- | --- | --- |
| `--radius` | `0.5rem` (8px) | Base |
| `--radius-sm` | `calc(var(--radius) - 4px)` → 4px | `rounded-sm` |
| `--radius-md` | `calc(var(--radius) - 2px)` → 6px | `rounded-md` (default for buttons/inputs/menus) |
| `--radius-lg` | `var(--radius)` → 8px | `rounded-lg` (cards, dialogs on `sm+`) |
| `--radius-xl` | `calc(var(--radius) + 4px)` → 12px | `rounded-xl` (media embeds in posts, inset sidebar) |
| `rounded-full` | 9999px | Avatars, badges, action pills, switch thumb |

### 5b. Borders

- Width: **1px** everywhere (`border`, `border-t`, etc). No thicker borders in the system.
- Color: `border-border` (light `oklch(0.922 0 0)`, dark `oklch(0.25 0 0)`), `border-input` mirrors it, `border-sidebar-border` mirrors it in the sidebar.
- Accent borders: `border-primary` (outline buttons), `border-destructive` (error inputs).
- Feed row dividers use a single `border-b border-border` per row rather than card edges.

### 5c. Shadows (elevation ladder)

All shadows live on `hsl(0 0% 0% / α)` — no colored shadows. Opacities below are for light theme; dark theme roughly doubles each alpha.

| Token | Definition |
| --- | --- |
| `--shadow-2xs` | `0 1px 2px 0 / .03` |
| `--shadow-xs` | `0 1px 2px 0 / .05` (used on buttons, inputs) |
| `--shadow-sm` | `0 1px 3px 0 / .08, 0 1px 2px -1px / .08` (cards, tab active) |
| `--shadow` | Same as `--shadow-sm` |
| `--shadow-md` | `0 2px 4px -1px / .06, 0 4px 6px -1px / .08` (dropdowns) |
| `--shadow-lg` | `0 4px 6px -2px / .05, 0 10px 15px -3px / .08` (dialog, sheet, submenus) |
| `--shadow-xl` | `0 8px 10px -4px / .04, 0 20px 25px -5px / .08` (unused in components, available) |
| `--shadow-2xl` | `0 25px 50px -12px / .20` (unused in components, available) |

---

## 6. Motion & Animation

### 6a. Libraries

- **`tw-animate-css`** (imported in `globals.css`) — provides the `animate-in / animate-out`, `fade-in-0 / fade-out-0`, `zoom-in-95 / zoom-out-95`, `slide-in-from-*` / `slide-out-to-*` utilities used by every Radix primitive wrapper.
- **GSAP** (`components/ui/fade-in.tsx`, `animated-text.tsx`, `animated-list.tsx`) — entrance animations for marketing / hero areas. Default: `ease: "power2.out"`, `duration: 0.8s`, `y: 0–30px`, optional `scale: 0.95 → 1`.
- **Framer Motion** is *not* currently a dependency despite being mentioned in rules.
- **CSS keyframes:** one custom, `@keyframes like-pop` (in `globals.css`).

### 6b. Durations

| Context | Duration |
| --- | --- |
| Dialog / Popover / Menu fade+zoom | default `animate-in` timing (~150ms) |
| Sheet open | `duration-500` |
| Sheet close | `duration-300` |
| Sidebar width/layout | `duration-200 ease-linear` |
| Dialog content | `duration-200` |
| Comment thread expand | `duration-300 ease-out` |
| Poll bar fill | `duration-500 ease-out` |
| Hover color transitions | default `transition-colors` (~150ms) |
| Like heart pop | `0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)` |

### 6c. Easings

- CSS: `ease-linear` (sidebar, rails), `ease-out` (content expand, poll fill), `ease-in-out` (sheet transition), custom `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for heart pop.
- GSAP: `power2.out`.

### 6d. Named keyframes / utility classes

| Name | Defined in | Usage |
| --- | --- | --- |
| `like-pop` | `globals.css` | `.animate-like-pop` on the heart icon in `post-actions.tsx` |
| `animate-pulse` | Tailwind built-in | Skeletons, loading placeholders |
| `animate-spin` | Tailwind built-in | `Loader` + inline `Loader2` usages |
| `animate-in / animate-out` (+ `fade-*`, `zoom-*`, `slide-*-from-*`) | `tw-animate-css` | Radix-driven open/close transitions |

### 6e. Reduced motion

No explicit `prefers-reduced-motion` handling is currently wired up. Flagged below.

---

## 7. Iconography & Imagery

### 7a. Icons

- **Library:** `lucide-react` (`components.json` → `iconLibrary: lucide`). `@heroicons/react` is also installed and used in the admin sidebar.
- **Default svg size inside buttons:** `[&_svg:not([class*='size-'])]:size-4` (16 px). Override with explicit `size-*`/`h-*`/`w-*` as needed.
- **Common custom sizes:** `h-3 w-3` / `size-3.5` (inside badges, breadcrumbs), `h-4 w-4` (most body icons, menu items), `h-5 w-5` (headings), `h-[18px] w-[18px]` (feed post-action icons), `h-12 w-12` (confirm screen status icons).
- **Sidebar icons:** forced to `[&>svg]:size-4` inside menu buttons.

### 7b. Avatars

- Base `Avatar` is `size-8` (32 px), `rounded-full`, `overflow-hidden`.
- Feed post avatar: `h-10 w-10` with fallback `bg-primary/10 text-lg`.
- Profile header avatar (breakout): custom larger sizes in `profile-header.tsx`.
- `AvatarFallback` is `rounded-full bg-muted flex items-center justify-center`.

### 7c. Imagery

- All post images render via **`next/image`** at `width={1200} height={675}` (16:9), `object-cover`, wrapped in a `rounded-xl overflow-hidden border border-border/60 bg-muted/20` container.
- Event images: `h-48 object-cover rounded-md` (4:3-ish area inside cards).
- Uploaded blob/preview URLs fall back to a raw `<img>` with the same sizing (the only sanctioned exception to the `next/image` rule, guarded by an eslint-disable comment).
- Profile cover: handled by `components/ui/cover-upload.tsx`.

---

## 8. Inconsistencies to Flag

Places where the same visual concept is expressed with different values. Worth fixing before extending the system further.

1. **Hard-coded Tailwind palette colors bypass the token system** (30+ files). Most frequent offenders:
   - Status / accent colors: `bg-green-500 / 600`, `bg-amber-500`, `bg-yellow-400`, `bg-orange-600`, `bg-purple-600`, `text-blue-600`, `text-red-500 / 600 / 700` — used in `members-table`, `member-detail-header`, `registrations-table`, `payments-table`, `events-table`, `member-activity-card`, `club-analytics`, `club-overview`, `app/admin/page.tsx`, `admin/waitlist/page.tsx`, `admin/payments/settings/page.tsx`, `events/AdminEventStats.tsx`, `events/EventHeader.tsx`, `events/EventDetailHeader.tsx`, `events/EventCard.tsx`, `settings/organizations-form.tsx`, `app/auth/confirm/page.tsx`.
   - Error-state card: `bg-red-50 border border-red-200 text-red-600 / 700` is duplicated verbatim across six club-management forms and three admin pages.
   - Hover shades: `hover:bg-gray-50 / gray-100 dark:hover:bg-gray-800 / 900` (should be `hover:bg-muted` or `hover:bg-accent`).
   - `components/app-sidebar.tsx` uses `bg-blue-500 / 600 text-white` for the primary quick-action pill instead of `bg-primary`.
   - `components/club-switcher.tsx` uses `bg-blue-500` as a "new" indicator dot.
   - `components/newsfeed/post-actions.tsx` uses raw `text-red-500 / hover:bg-red-500/10` for the like button and `text-green-500 / hover:bg-green-500/10` for share. There is no corresponding "like" or "share" token.

   **Recommendation:** introduce semantic status tokens (`--success`, `--warning`, `--info`, optionally `--like`) and migrate all of the above.

2. **No `success` / `warning` / `info` tokens.** Only `--destructive` exists. Every component that needs "all good" or "be careful" state invents its own `green-*` / `amber-*` / `blue-*` combination.

3. **Input-family height / focus-ring mismatch.**
   - `Input` and `Button` (default) are `h-9` with a 3px ring (`focus-visible:ring-[3px] focus-visible:ring-ring/50`).
   - `Select` trigger is `h-10` with a 2px ring (`focus:ring-2 focus:ring-ring focus:ring-offset-2`).
   - `Textarea` uses the older 2px ring pattern.
   - `Switch`, `Tabs`, `Sheet`, `Dialog`, `Sidebar` also use the 2px ring.
   - Result: inline forms show mismatched focus states depending on which control is active.

4. **Magic-number typography.** `text-[15px]` (post body & header), `text-[13px]` (reaction counters), `text-[12px]` (message editor), `text-[11px]` (debug auth badge) all sit outside the Tailwind scale. `h-[18px] w-[18px]` (post-action icons), `min-h-[72px]`, `max-h-[200px]`, `ml-13` are similar.
   **Recommendation:** either codify `--text-feed-body`, `--text-feed-meta` tokens, or step up/down to `text-sm` / `text-base`.

5. **Duplicated skeleton patterns.** `components/ui/skeleton.tsx` uses `bg-foreground/[0.06] dark:bg-foreground/[0.08]`, but `components/club-management/club-overview.tsx` and `app/admin/club-management/page.tsx` roll their own skeleton rows with `bg-gray-200` + `animate-pulse`. Unifies to the primitive.

6. **Hover-row conventions.** Some feed/list rows use `hover:bg-muted/50` (poll options, search hits), others use `hover:bg-gray-50 dark:hover:bg-gray-900/50` (event cards, event action buttons), others use `hover:bg-accent` (buttons). Pick one (`bg-muted/50` reads as a neutral row hover; `bg-accent` reads as a stronger hover).

7. **Heading scale is ad-hoc.** `CardTitle` = `text-2xl`, `DialogTitle` = `text-lg`, `SheetTitle` = unsized. No `<H1>` / `<H2>` primitive. Page-level titles in app routes are written as raw `h1 className="text-3xl font-bold"` or similar and vary by page.

8. **Two parallel CTA styles in the sidebar.** `app-sidebar.tsx` paints its featured "+ Create" style affordance with `bg-blue-500 text-white hover:bg-blue-600`, while every other primary action uses `bg-primary hover:bg-primary/90`. The blue values are close but not identical to `--primary`.

9. **Tooltips are branded but the rest of the system stays neutral.** `TooltipContent` is `bg-primary text-primary-foreground`. That's a strong departure from the pure-neutral "color only in primary CTAs" rule stated in `globals.css`. Intentional? Worth documenting either way.

10. **Animation libraries split.** `tw-animate-css` + native CSS + GSAP are all in use. `framer-motion` is referenced in project rules but not installed. Consolidate.

11. **Reduced-motion compliance.** Neither the global CSS nor the GSAP helpers check `prefers-reduced-motion`. `app/globals.css` has no `@media (prefers-reduced-motion: reduce)` block.

12. **Next.js portal override (`nextjs-portal { left: unset; top: unset; }`) in `globals.css`.** Comment says "persisted from browser preview" — should be reviewed and removed if it's Preview-only debris.

13. **`--tracking-normal` and `--spacing` are declared but not wired into `@theme inline`.** They work because Tailwind v4 already knows about spacing, but if you want to *change* the base spacing you'd have to also expose it. Minor.

14. **Dark-mode card surface equals page background (`oklch(0.13 0 0)` for both).** Cards on the dark theme are only distinguishable by their border and shadow, not by a lift in value. In dense screens (feed, tables) this can feel flat. Consider raising `--card` to `oklch(0.16 0 0)` (same as `--popover`).

---

## 9. Where to find what

| Concern | File |
| --- | --- |
| Tokens (colors, radii, shadows, fonts) | `app/globals.css` |
| Font loading | `app/layout.tsx` |
| Utility merge helper (`cn`) | `lib/utils.ts` |
| Base primitives | `components/ui/*` |
| Feature composites | `components/{events,newsfeed,profile,messages,club-management,admin,...}/*` |
| App shell / sidebar wiring | `components/conditional-sidebar.tsx`, `components/app-sidebar.tsx`, `components/admin/admin-sidebar.tsx` |
| Theming provider | `components/theme-provider.tsx` (light default, `next-themes`) |
| Mobile breakpoint hook | `hooks/use-mobile.ts` (`768 px`) |
| Design-token reference (generated) | `docs/design-tokens.css` |

## 10. How to verify

- **Open** `/animations` in the running app (`npm run dev`) to see the GSAP entrance animations live.
- **Run** `npm run lint && npm run typecheck` to confirm nothing in this doc broke the build (the doc itself is lint-free Markdown).
- **Visual smoke test:** open the feed (`/`), a dialog (`/settings`), the admin sidebar (`/admin`), and the sheet (mobile width ≤ 767 px) in both light and dark mode; compare against the tokens above.
