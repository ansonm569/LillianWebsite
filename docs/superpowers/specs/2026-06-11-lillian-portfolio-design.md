# Lillian MacKinney Portfolio & Shop — Design Spec

**Date:** 2026-06-11
**Domain:** lillianmackinney.com
**Hosting:** Vercel (Hobby plan)
**Stack:** Next.js (App Router) · TypeScript · Stripe Elements

---

## Goals

A refined, minimalistic, high-brow portfolio site for artist Lillian MacKinney. Displays flat works (paintings, charcoal, Indian ink, drawings) and allows buyers to purchase directly on-site without leaving the domain. Cost is optimized to zero fixed overhead — only Stripe's per-transaction fee applies on sales.

---

## Pages & Navigation

### Routes

| Route | Purpose |
|---|---|
| `/` | Home — sparse hero with one featured work or tagline, minimal intro |
| `/work` | Gallery — full catalog in masonry grid |
| `/work/[slug]` | Piece detail — large image, metadata, purchase flow |
| `/about` | Bio and artist statement |

### Navigation

Persistent top bar across all pages:

- **Left:** "Lillian MacKinney" — links to `/`
- **Right:** "Work · About"
- **Footer:** `contact@lillianmackinney.com` (plain mailto link) · copyright

No hamburger menu. On mobile, nav links collapse to minimal inline layout.

---

## Gallery (`/work`)

### Layout

Masonry grid using `react-masonry-css`. Each image renders at its natural proportions (no cropping). Responsive breakpoints:

- Desktop (≥1024px): 3 columns
- Tablet (≥640px): 2 columns
- Mobile (<640px): 1 column

### Piece Cards

Each card in the grid shows:
- Image only (no overlay text by default)
- On hover: title and price appear below the image (not as an overlay — overlaying text on art feels intrusive)
- Sold pieces: image shown with a "Sold" label; still browsable

Cards link to `/work/[slug]`.

---

## Piece Detail (`/work/[slug]`)

### Layout

Two-column on desktop (image left, metadata right), stacked on mobile.

**Left:** Full artwork image (Next.js `<Image>` with priority loading)

**Right:**
- Title
- Year
- Medium
- Dimensions
- Price (USD)
- "Purchase" button (if available) or "Sold" label
- "← Back to Work" link

### Purchase Modal

Triggered by "Purchase" button. Slide-up drawer/modal overlay containing:

1. Piece summary (title · price)
2. Shipping info fields: Name, Email, Address, City, State, ZIP, Country
3. Stripe Elements card input
4. Shipping note: flat rate amount (set by Lillian, displayed before payment — e.g. "$15 flat rate shipping within US")
5. "Pay $[amount]" submit button
6. "🔒 Secure payment via Stripe" note
6. Close (✕) button

On success: modal transitions to a confirmation message. No redirect needed.

---

## Checkout Flow

### Client → Server sequence

1. Buyer fills shipping fields and card details in modal
2. On submit: Next.js Server Action is called with price slug and shipping data
3. Server Action creates a Stripe `PaymentIntent` with:
   - `amount` (in cents, from catalog)
   - `currency: "usd"`
   - `metadata`: buyer name, email, shipping address, piece slug
4. Returns `client_secret` to the client
5. Stripe Elements `confirmPayment()` runs client-side — card data never touches the server
6. On success: modal shows confirmation state

### Post-payment

- **Buyer** receives a Stripe payment receipt to their email (enabled via Stripe dashboard setting — free, automatic, Stripe-branded)
- **Lillian** receives a Stripe payment notification email (automatic)
- Both notifications require zero extra code
- Order details (buyer name, shipping address, amount) visible in Stripe dashboard

### Marking pieces as sold

Manual process: set `available: false` in the catalog data file and push. No automation in v1. This is deliberate — sales volume doesn't warrant automation, and manual confirmation gives Lillian a chance to verify before updating the site.

---

## Data Model

All artwork lives in `src/data/catalog.ts` as a typed array. Adding a new piece = one new object + one image file committed.

```typescript
type Artwork = {
  slug: string        // URL segment: /work/[slug]
  title: string
  year: number
  medium: string      // e.g. "Charcoal on paper"
  dimensions: string  // e.g. "18 × 24 in"
  price: number       // USD, whole dollars
  available: boolean  // false = shows "Sold", cannot purchase
  image: string       // path: /images/[filename].jpg
  description?: string // optional artist note, shown on detail page
}
```

### Example entry

```typescript
{
  slug: "untitled-no-4",
  title: "Untitled No. 4",
  year: 2024,
  medium: "Charcoal on paper",
  dimensions: "18 × 24 in",
  price: 480,
  available: true,
  image: "/images/untitled-no-4.jpg",
}
```

---

## Image Handling

- **Storage:** `/public/images/` in the git repo, served as static assets by Vercel's CDN
- **Pre-commit preparation:** resize to max 1800px on longest edge, compress to JPEG ~85% quality before committing (one-time per image, any image tool)
- **Rendering:** Next.js `<Image>` component handles lazy loading, responsive `srcset`, and format optimization automatically
- **Volume:** 20–50 images at ~500KB–1MB each ≈ 25–50MB total — well within git repo limits

---

## Aesthetic Direction

- **Typography:** Serif or high-contrast sans-serif for headings; clean sans for body
- **Color:** Near-white background, near-black text; minimal accent color (or none)
- **Spacing:** Generous whitespace — the art breathes
- **Interactions:** Subtle — hover states, smooth modal open/close; no flashy animations
- **No carousel, no auto-play, no pop-ups**

---

## Cost Summary

| Item | Cost |
|---|---|
| Vercel Hobby hosting | Free |
| Image storage & CDN (static in repo) | Free |
| Stripe per-transaction | ~2.9% + $0.30 per sale |
| Domain (lillianmackinney.com) | ~$12/yr |
| **Fixed monthly cost** | **$0** |

---

## Out of Scope (v1)

- Custom-branded buyer confirmation emails (future: Resend + Stripe webhook)
- Automatic sold/available toggling via webhook
- Filtering or search in the gallery
- Print-on-demand or digital downloads
- User accounts or order history
- Shipping rate calculation (flat rate or contact-for-shipping noted in modal)
- CMS admin panel (Anson manages catalog via git)

---

## Future Considerations

- **Custom confirmation email:** Add Resend (free tier) + a Stripe `payment_intent.succeeded` webhook to send a Lillian-branded receipt with shipping confirmation
- **Sold automation:** Stripe webhook sets `available: false` via a CMS or database write, eliminating the manual step
- **Series/collections:** Group works by series using an optional `series` field on `Artwork`
