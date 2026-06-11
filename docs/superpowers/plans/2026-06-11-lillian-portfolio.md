# Lillian MacKinney Portfolio & Shop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a minimalistic art portfolio site with on-site Stripe checkout at lillianmackinney.com.

**Architecture:** Next.js 14 App Router on Vercel. Art catalog is a TypeScript array in the repo — adding a piece means appending one object and committing an optimized image to `/public/images`. Checkout is an on-page slide-up modal using Stripe CardElement so the buyer never leaves the domain. Shipping info is collected in the modal form and stored as metadata on the Stripe PaymentIntent.

**Tech Stack:** Next.js 14 (App Router) · TypeScript · CSS Modules · `react-masonry-css` · `@stripe/stripe-js` · `@stripe/react-stripe-js` · `stripe` (server SDK) · Jest + React Testing Library

---

## File Map

| File | Responsibility |
|---|---|
| `src/data/catalog.ts` | `Artwork` type + catalog array + `getArtwork(slug)` helper |
| `src/lib/stripe.ts` | Stripe server SDK singleton |
| `src/styles/globals.css` | CSS custom properties, reset, typography, base styles |
| `src/app/layout.tsx` | Root layout — fonts (next/font), Nav, Footer |
| `src/app/page.tsx` | Home — featured work hero + tagline |
| `src/app/work/page.tsx` | Gallery — masonry grid of all works |
| `src/app/work/[slug]/page.tsx` | Piece detail — image, metadata, purchase trigger |
| `src/app/work/[slug]/PurchaseButton.tsx` | Client wrapper that owns modal open/close state |
| `src/app/about/page.tsx` | About — bio + artist statement |
| `src/app/api/create-payment-intent/route.ts` | POST: validate artwork, create Stripe PaymentIntent, return `clientSecret` |
| `src/components/Nav.tsx` + `Nav.module.css` | Top bar: site name left, Work/About links right |
| `src/components/Footer.tsx` + `Footer.module.css` | Footer: email link + copyright |
| `src/components/ArtworkCard.tsx` + `ArtworkCard.module.css` | Gallery card: image, hover title/price, sold badge |
| `src/components/MasonryGrid.tsx` + `MasonryGrid.module.css` | `react-masonry-css` wrapper with responsive breakpoints |
| `src/components/StripeProvider.tsx` | Client component: loads Stripe, wraps children in `<Elements>` |
| `src/components/PurchaseModal.tsx` + `PurchaseModal.module.css` | Checkout modal: shipping form + CardElement + submit logic |

---

## Task 1: Project Scaffold + Test Configuration

**Files:**
- Scaffold: all Next.js project files
- Create: `jest.config.ts`, `jest.setup.ts`, `.env.local`

- [ ] **Step 1: Scaffold Next.js project**

Run in `C:/Users/AnsonMacKinney/GitHub/Lillian Site/LillianWebsite`:

```bash
npx create-next-app@latest . --typescript --app --src-dir --no-tailwind --import-alias "@/*" --use-npm
```

When asked "would you like to continue?" (existing files detected) → **Yes**.
Accept all other defaults.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install react-masonry-css @stripe/stripe-js @stripe/react-stripe-js stripe
```

- [ ] **Step 3: Install dev/test dependencies**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

- [ ] **Step 4: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

- [ ] **Step 5: Create `jest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create `.env.local`**

```bash
STRIPE_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_TEST_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY
```

Get both keys from https://dashboard.stripe.com/test/apikeys (use test keys during development).

- [ ] **Step 7: Verify the scaffold builds**

```bash
npm run build
```

Expected: build succeeds (may warn about missing image files — that's fine).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Jest configuration"
```

---

## Task 2: Global Styles + Typography

**Files:**
- Create: `src/styles/globals.css`
- Modify: `src/app/layout.tsx`
- Delete: `src/app/globals.css` (replaced by `src/styles/globals.css`)

- [ ] **Step 1: Create `src/styles/` directory and `globals.css`**

```bash
mkdir -p src/styles
```

Create `src/styles/globals.css`:

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --color-bg: #faf9f7;
  --color-text: #1a1a18;
  --color-muted: #6b6b68;
  --color-border: #e5e3de;
  --color-sold: #9ca3af;

  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 2rem;
  --space-lg: 4rem;
  --space-xl: 8rem;

  --max-width: 1200px;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body, system-ui, sans-serif);
  font-weight: 300;
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

h1, h2, h3 {
  font-family: var(--font-heading, Georgia, serif);
  font-weight: 300;
  line-height: 1.2;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  display: block;
  max-width: 100%;
}

button {
  cursor: pointer;
  font-family: var(--font-body, system-ui, sans-serif);
}

main {
  flex: 1;
}
```

- [ ] **Step 2: Update `src/app/layout.tsx` with fonts + global styles**

```typescript
import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import '@/styles/globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Lillian MacKinney',
  description: 'Original works by Lillian MacKinney — paintings, charcoal, and ink on paper.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Delete the old globals.css**

```bash
rm src/app/globals.css
```

Also delete the default `src/app/page.module.css` if it exists (we'll create our own):

```bash
rm -f src/app/page.module.css
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Open http://localhost:3000. Background should be near-white (`#faf9f7`). Page should load without errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles/globals.css src/app/layout.tsx
git commit -m "feat: add global styles and next/font typography"
```

---

## Task 3: Art Catalog — Type, Data, and Tests

**Files:**
- Create: `src/data/catalog.ts`
- Create: `src/__tests__/catalog.test.ts`
- Create: `public/images/.gitkeep`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/catalog.test.ts`:

```typescript
import { catalog, getArtwork } from '@/data/catalog'

describe('catalog', () => {
  test('every entry has required fields with valid values', () => {
    catalog.forEach((artwork, i) => {
      expect(artwork.slug, `entry ${i} slug`).toBeTruthy()
      expect(artwork.title, `entry ${i} title`).toBeTruthy()
      expect(artwork.year, `entry ${i} year`).toBeGreaterThan(1900)
      expect(artwork.medium, `entry ${i} medium`).toBeTruthy()
      expect(artwork.dimensions, `entry ${i} dimensions`).toBeTruthy()
      expect(artwork.price, `entry ${i} price`).toBeGreaterThan(0)
      expect(typeof artwork.available, `entry ${i} available`).toBe('boolean')
      expect(artwork.image, `entry ${i} image`).toMatch(/^\/images\/.+\.jpg$/)
    })
  })

  test('slugs are unique across catalog', () => {
    const slugs = catalog.map(a => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  test('getArtwork returns artwork by slug', () => {
    const first = catalog[0]
    expect(getArtwork(first.slug)).toEqual(first)
  })

  test('getArtwork returns undefined for unknown slug', () => {
    expect(getArtwork('does-not-exist')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --testPathPattern=catalog
```

Expected: FAIL — "Cannot find module '@/data/catalog'"

- [ ] **Step 3: Create `src/data/catalog.ts`**

```typescript
export type Artwork = {
  slug: string
  title: string
  year: number
  medium: string
  dimensions: string
  price: number
  available: boolean
  image: string
  description?: string
}

export const catalog: Artwork[] = [
  {
    slug: 'untitled-no-1',
    title: 'Untitled No. 1',
    year: 2024,
    medium: 'Charcoal on paper',
    dimensions: '18 × 24 in',
    price: 480,
    available: true,
    image: '/images/untitled-no-1.jpg',
  },
  {
    slug: 'study-in-ink',
    title: 'Study in Ink',
    year: 2024,
    medium: 'Indian ink on paper',
    dimensions: '12 × 16 in',
    price: 320,
    available: true,
    image: '/images/study-in-ink.jpg',
  },
  {
    slug: 'evening-figure',
    title: 'Evening Figure',
    year: 2023,
    medium: 'Oil on canvas',
    dimensions: '24 × 36 in',
    price: 1200,
    available: false,
    image: '/images/evening-figure.jpg',
  },
]

export function getArtwork(slug: string): Artwork | undefined {
  return catalog.find(a => a.slug === slug)
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- --testPathPattern=catalog
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Create the images directory**

```bash
mkdir -p public/images && touch public/images/.gitkeep
```

> **Note:** Before launching, replace the three seed entries with Lillian's real works. Add a real optimized image file to `public/images/` for each entry (max 1800px on longest edge, JPEG ~85% quality), update `catalog.ts` accordingly, and remove `.gitkeep`.

- [ ] **Step 6: Commit**

```bash
git add src/data/catalog.ts src/__tests__/catalog.test.ts public/images/.gitkeep
git commit -m "feat: add artwork catalog type, seed data, and tests"
```

---

## Task 4: Nav + Footer + Root Layout

**Files:**
- Create: `src/components/Nav.tsx`, `src/components/Nav.module.css`
- Create: `src/components/Footer.tsx`, `src/components/Footer.module.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create `src/components/Nav.tsx`**

```typescript
import Link from 'next/link'
import styles from './Nav.module.css'

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.brand}>Lillian MacKinney</Link>
      <div className={styles.links}>
        <Link href="/work">Work</Link>
        <Link href="/about">About</Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create `src/components/Nav.module.css`**

```css
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 300;
  letter-spacing: 0.05em;
}

.links {
  display: flex;
  gap: var(--space-md);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.links a:hover {
  color: var(--color-muted);
}

@media (max-width: 480px) {
  .nav { padding: 1rem var(--space-sm); }
  .links { gap: var(--space-sm); }
}
```

- [ ] **Step 3: Create `src/components/Footer.tsx`**

```typescript
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <a href="mailto:contact@lillianmackinney.com">
        contact@lillianmackinney.com
      </a>
      <span className={styles.copy}>
        © {new Date().getFullYear()} Lillian MacKinney
      </span>
    </footer>
  )
}
```

- [ ] **Step 4: Create `src/components/Footer.module.css`**

```css
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border-top: 1px solid var(--color-border);
  font-size: 0.8rem;
  color: var(--color-muted);
}

.footer a:hover { color: var(--color-text); }

.copy { font-style: italic; }

@media (max-width: 480px) {
  .footer {
    flex-direction: column;
    gap: var(--space-xs);
    text-align: center;
    padding: var(--space-sm);
  }
}
```

- [ ] **Step 5: Update `src/app/layout.tsx` to include Nav and Footer**

```typescript
import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import '@/styles/globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Lillian MacKinney',
  description: 'Original works by Lillian MacKinney — paintings, charcoal, and ink on paper.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable}`}>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Verify**

```bash
npm run dev
```

Open http://localhost:3000. "Lillian MacKinney" nav should appear at top. Footer with `contact@lillianmackinney.com` at bottom.

- [ ] **Step 7: Commit**

```bash
git add src/components/Nav.tsx src/components/Nav.module.css src/components/Footer.tsx src/components/Footer.module.css src/app/layout.tsx
git commit -m "feat: add Nav, Footer, and wire into root layout"
```

---

## Task 5: Home Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/page.module.css`

- [ ] **Step 1: Replace `src/app/page.tsx`**

```typescript
import Image from 'next/image'
import Link from 'next/link'
import { catalog } from '@/data/catalog'
import styles from './page.module.css'

export default function Home() {
  const featured = catalog.find(a => a.available) ?? catalog[0]

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.imageCol}>
          <Image
            src={featured.image}
            alt={featured.title}
            width={800}
            height={1000}
            style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
            priority
          />
        </div>
        <div className={styles.introCol}>
          <p className={styles.tagline}>Original works on paper and canvas.</p>
          <Link href="/work" className={styles.cta}>View all work →</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/page.module.css`**

```css
.page {
  padding: var(--space-lg) var(--space-md);
  max-width: var(--max-width);
  margin: 0 auto;
}

.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  align-items: center;
  min-height: 65vh;
}

.introCol {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.tagline {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 300;
  font-style: italic;
  color: var(--color-muted);
  line-height: 1.4;
}

.cta {
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-text);
  padding-bottom: 2px;
  width: fit-content;
}

.cta:hover {
  color: var(--color-muted);
  border-color: var(--color-muted);
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    min-height: auto;
    gap: var(--space-md);
  }
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Open http://localhost:3000. Layout should be two-column with a placeholder image area on the left and tagline + link on the right. Image will be broken until real images are added.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/page.module.css
git commit -m "feat: add home page hero"
```

---

## Task 6: Gallery Page — ArtworkCard + MasonryGrid

**Files:**
- Create: `src/components/ArtworkCard.tsx`, `src/components/ArtworkCard.module.css`
- Create: `src/components/MasonryGrid.tsx`, `src/components/MasonryGrid.module.css`
- Create: `src/app/work/page.tsx`, `src/app/work/page.module.css`
- Create: `src/__tests__/ArtworkCard.test.tsx`

- [ ] **Step 1: Write failing tests for ArtworkCard**

Create `src/__tests__/ArtworkCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import ArtworkCard from '@/components/ArtworkCard'
import type { Artwork } from '@/data/catalog'

const base: Artwork = {
  slug: 'test-piece',
  title: 'Test Piece',
  year: 2024,
  medium: 'Charcoal on paper',
  dimensions: '18 × 24 in',
  price: 400,
  available: true,
  image: '/images/test.jpg',
}

describe('ArtworkCard', () => {
  test('renders title and price when available', () => {
    render(<ArtworkCard artwork={base} />)
    expect(screen.getByText('Test Piece')).toBeInTheDocument()
    expect(screen.getByText('$400')).toBeInTheDocument()
  })

  test('renders Sold label and hides price when not available', () => {
    render(<ArtworkCard artwork={{ ...base, available: false }} />)
    expect(screen.getByText('Sold')).toBeInTheDocument()
    expect(screen.queryByText('$400')).not.toBeInTheDocument()
  })

  test('links to the piece detail page', () => {
    render(<ArtworkCard artwork={base} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/work/test-piece')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --testPathPattern=ArtworkCard
```

Expected: FAIL — "Cannot find module '@/components/ArtworkCard'"

- [ ] **Step 3: Create `src/components/ArtworkCard.tsx`**

```typescript
import Image from 'next/image'
import Link from 'next/link'
import type { Artwork } from '@/data/catalog'
import styles from './ArtworkCard.module.css'

type Props = { artwork: Artwork }

export default function ArtworkCard({ artwork }: Props) {
  return (
    <Link href={`/work/${artwork.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={artwork.image}
          alt={artwork.title}
          width={600}
          height={800}
          style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
        />
        {!artwork.available && (
          <span className={styles.soldBadge}>Sold</span>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.title}>{artwork.title}</span>
        {artwork.available && (
          <span className={styles.price}>${artwork.price}</span>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Create `src/components/ArtworkCard.module.css`**

```css
.card {
  display: block;
  margin-bottom: 2rem;
}

.imageWrapper {
  position: relative;
  overflow: hidden;
}

.soldBadge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-bg);
  background: var(--color-sold);
  padding: 0.2rem 0.5rem;
}

.info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.card:hover .info {
  opacity: 1;
}

.title {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 300;
}

.price {
  font-size: 0.8rem;
  color: var(--color-muted);
}
```

- [ ] **Step 5: Create `src/components/MasonryGrid.tsx`**

```typescript
'use client'

import Masonry from 'react-masonry-css'
import type { Artwork } from '@/data/catalog'
import ArtworkCard from './ArtworkCard'
import styles from './MasonryGrid.module.css'

const breakpointCols = { default: 3, 1024: 2, 640: 1 }

type Props = { artworks: Artwork[] }

export default function MasonryGrid({ artworks }: Props) {
  return (
    <Masonry
      breakpointCols={breakpointCols}
      className={styles.grid}
      columnClassName={styles.column}
    >
      {artworks.map(artwork => (
        <ArtworkCard key={artwork.slug} artwork={artwork} />
      ))}
    </Masonry>
  )
}
```

- [ ] **Step 6: Create `src/components/MasonryGrid.module.css`**

```css
.grid {
  display: flex;
  gap: 2rem;
  width: 100%;
}

.column {
  flex: 1;
  min-width: 0;
}
```

- [ ] **Step 7: Create `src/app/work/page.tsx`**

```typescript
import { catalog } from '@/data/catalog'
import MasonryGrid from '@/components/MasonryGrid'
import styles from './page.module.css'

export const metadata = { title: 'Work — Lillian MacKinney' }

export default function WorkPage() {
  return (
    <div className={styles.page}>
      <MasonryGrid artworks={catalog} />
    </div>
  )
}
```

- [ ] **Step 8: Create `src/app/work/page.module.css`**

```css
.page {
  padding: var(--space-md);
  max-width: var(--max-width);
  margin: 0 auto;
}
```

- [ ] **Step 9: Run tests**

```bash
npm test -- --testPathPattern=ArtworkCard
```

Expected: PASS — 3 tests passing

- [ ] **Step 10: Verify in browser**

```bash
npm run dev
```

Navigate to http://localhost:3000/work. Masonry grid renders in 3 columns. Hovering a card fades in the title and price below it.

- [ ] **Step 11: Commit**

```bash
git add src/components/ArtworkCard.tsx src/components/ArtworkCard.module.css src/components/MasonryGrid.tsx src/components/MasonryGrid.module.css src/app/work/page.tsx src/app/work/page.module.css src/__tests__/ArtworkCard.test.tsx
git commit -m "feat: add masonry gallery with artwork cards"
```

---

## Task 7: Piece Detail Page

**Files:**
- Create: `src/app/work/[slug]/page.tsx`
- Create: `src/app/work/[slug]/page.module.css`

> The Purchase button is a disabled placeholder here. It becomes functional in Task 9 when the modal is wired in.

- [ ] **Step 1: Create `src/app/work/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { catalog, getArtwork } from '@/data/catalog'
import styles from './page.module.css'

type Props = { params: { slug: string } }

export function generateStaticParams() {
  return catalog.map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props) {
  const artwork = getArtwork(params.slug)
  if (!artwork) return {}
  return { title: `${artwork.title} — Lillian MacKinney` }
}

export default function PiecePage({ params }: Props) {
  const artwork = getArtwork(params.slug)
  if (!artwork) notFound()

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <div className={styles.imageCol}>
          <Image
            src={artwork.image}
            alt={artwork.title}
            width={900}
            height={1200}
            style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
            priority
          />
        </div>
        <div className={styles.infoCol}>
          <h1 className={styles.title}>{artwork.title}</h1>
          <p className={styles.meta}>{artwork.year}</p>
          <p className={styles.meta}>{artwork.medium}</p>
          <p className={styles.meta}>{artwork.dimensions}</p>
          {artwork.description && (
            <p className={styles.description}>{artwork.description}</p>
          )}
          <div className={styles.purchaseBlock}>
            {artwork.available ? (
              <>
                <p className={styles.price}>${artwork.price}</p>
                {/* Replace with <PurchaseButton artwork={artwork} /> in Task 9 */}
                <button className={styles.button} disabled>Purchase</button>
              </>
            ) : (
              <p className={styles.sold}>Sold</p>
            )}
          </div>
          <Link href="/work" className={styles.back}>← Back to Work</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/work/[slug]/page.module.css`**

```css
.page {
  padding: var(--space-lg) var(--space-md);
  max-width: var(--max-width);
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  align-items: start;
}

.infoCol {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  position: sticky;
  top: var(--space-md);
}

.title {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 300;
  margin-bottom: var(--space-xs);
}

.meta {
  font-size: 0.9rem;
  color: var(--color-muted);
}

.description {
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--color-muted);
  font-style: italic;
  margin-top: var(--space-sm);
}

.purchaseBlock {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.price {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 300;
}

.button {
  background: var(--color-text);
  color: var(--color-bg);
  border: none;
  padding: 0.75rem 2rem;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  width: fit-content;
  transition: opacity 0.2s;
}

.button:hover:not(:disabled) { opacity: 0.8; }
.button:disabled { opacity: 0.5; cursor: default; }

.sold {
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-sold);
}

.back {
  font-size: 0.8rem;
  color: var(--color-muted);
  margin-top: var(--space-md);
  display: inline-block;
}

.back:hover { color: var(--color-text); }

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; gap: var(--space-md); }
  .infoCol { position: static; }
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Navigate to http://localhost:3000/work/untitled-no-1 — title, year, medium, dimensions, disabled Purchase button. Navigate to http://localhost:3000/work/evening-figure — should show "Sold". Navigate to http://localhost:3000/work/does-not-exist — should show Next.js 404 page.

- [ ] **Step 4: Commit**

```bash
git add src/app/work/[slug]/page.tsx src/app/work/[slug]/page.module.css
git commit -m "feat: add piece detail page"
```

---

## Task 8: Stripe PaymentIntent API Route + Tests

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/app/api/create-payment-intent/route.ts`
- Create: `src/app/api/create-payment-intent/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/app/api/create-payment-intent/__tests__/route.test.ts`:

```typescript
import { POST } from '../route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: 'pi_test_secret_123' }),
    },
  },
}))

jest.mock('@/data/catalog', () => ({
  getArtwork: jest.fn((slug: string) => {
    if (slug === 'available-piece') {
      return { slug: 'available-piece', title: 'A Piece', price: 400, available: true }
    }
    if (slug === 'sold-piece') {
      return { slug: 'sold-piece', title: 'Sold', price: 200, available: false }
    }
    return undefined
  }),
}))

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/create-payment-intent', () => {
  test('returns clientSecret for valid available artwork', async () => {
    const req = makeRequest({
      slug: 'available-piece',
      name: 'Jane Buyer',
      email: 'jane@example.com',
      address: { line1: '123 Main St', city: 'Portland', state: 'OR', postal_code: '97201', country: 'US' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.clientSecret).toBe('pi_test_secret_123')
  })

  test('returns 404 for unknown artwork slug', async () => {
    const req = makeRequest({ slug: 'unknown', name: 'x', email: 'x@x.com', address: {} })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  test('returns 400 for sold artwork', async () => {
    const req = makeRequest({ slug: 'sold-piece', name: 'x', email: 'x@x.com', address: {} })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --testPathPattern=create-payment-intent
```

Expected: FAIL — "Cannot find module '@/lib/stripe'"

- [ ] **Step 3: Create `src/lib/stripe.ts`**

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

- [ ] **Step 4: Create `src/app/api/create-payment-intent/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getArtwork } from '@/data/catalog'

type ShippingAddress = {
  line1: string
  city: string
  state: string
  postal_code: string
  country: string
}

type Body = {
  slug: string
  name: string
  email: string
  address: ShippingAddress
}

export async function POST(req: NextRequest) {
  const { slug, name, email, address }: Body = await req.json()

  const artwork = getArtwork(slug)
  if (!artwork) {
    return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
  }
  if (!artwork.available) {
    return NextResponse.json({ error: 'Artwork is not available' }, { status: 400 })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: artwork.price * 100,
    currency: 'usd',
    receipt_email: email,
    metadata: {
      artwork_slug: slug,
      artwork_title: artwork.title,
      buyer_name: name,
      buyer_email: email,
      shipping_line1: address.line1,
      shipping_city: address.city,
      shipping_state: address.state,
      shipping_postal_code: address.postal_code,
      shipping_country: address.country,
    },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
npm test -- --testPathPattern=create-payment-intent
```

Expected: PASS — 3 tests passing

- [ ] **Step 6: Commit**

```bash
git add src/lib/stripe.ts src/app/api/create-payment-intent/route.ts "src/app/api/create-payment-intent/__tests__/route.test.ts"
git commit -m "feat: add Stripe PaymentIntent API route with tests"
```

---

## Task 9: Purchase Modal (Stripe Elements + Checkout)

**Files:**
- Create: `src/components/StripeProvider.tsx`
- Create: `src/components/PurchaseModal.tsx`, `src/components/PurchaseModal.module.css`
- Create: `src/app/work/[slug]/PurchaseButton.tsx`
- Modify: `src/app/work/[slug]/page.tsx`
- Create: `src/__tests__/PurchaseModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/PurchaseModal.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import PurchaseModal from '@/components/PurchaseModal'
import type { Artwork } from '@/data/catalog'

jest.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => ({ confirmCardPayment: jest.fn() }),
  useElements: () => ({ getElement: jest.fn() }),
  CardElement: () => <div data-testid="card-element" />,
}))

const mockArtwork: Artwork = {
  slug: 'test-piece',
  title: 'Test Piece',
  year: 2024,
  medium: 'Charcoal on paper',
  dimensions: '18 × 24 in',
  price: 400,
  available: true,
  image: '/images/test.jpg',
}

describe('PurchaseModal', () => {
  test('renders artwork title and price', () => {
    render(<PurchaseModal artwork={mockArtwork} onClose={() => {}} />)
    expect(screen.getByText('Test Piece')).toBeInTheDocument()
    expect(screen.getByText('$400')).toBeInTheDocument()
  })

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(<PurchaseModal artwork={mockArtwork} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('shows all required shipping input fields', () => {
    render(<PurchaseModal artwork={mockArtwork} onClose={() => {}} />)
    expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Street address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('City')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('State')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ZIP')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --testPathPattern=PurchaseModal
```

Expected: FAIL — "Cannot find module '@/components/PurchaseModal'"

- [ ] **Step 3: Create `src/components/StripeProvider.tsx`**

```typescript
'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type Props = { children: React.ReactNode }

export default function StripeProvider({ children }: Props) {
  return <Elements stripe={stripePromise}>{children}</Elements>
}
```

- [ ] **Step 4: Create `src/components/PurchaseModal.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { Artwork } from '@/data/catalog'
import styles from './PurchaseModal.module.css'

type Props = { artwork: Artwork; onClose: () => void }

type FormState = {
  name: string; email: string; line1: string
  city: string; state: string; postal_code: string; country: string
}

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1a1a18',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '300',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
}

export default function PurchaseModal({ artwork, onClose }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [form, setForm] = useState<FormState>({
    name: '', email: '', line1: '', city: '', state: '', postal_code: '', country: 'US',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function update(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: artwork.slug,
          name: form.name,
          email: form.email,
          address: {
            line1: form.line1,
            city: form.city,
            state: form.state,
            postal_code: form.postal_code,
            country: form.country,
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Payment setup failed')
      }
      const { clientSecret } = await res.json()
      const cardElement = elements.getElement(CardElement)!
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: form.name, email: form.email },
        },
      })
      if (error) throw new Error(error.message)
      setStatus('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.success}>
            <h2>Thank you</h2>
            <p>
              Your purchase of <em>{artwork.title}</em> is confirmed.
              A receipt has been sent to {form.email}.
            </p>
            <button className={styles.closeBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p className={styles.modalLabel}>Complete your purchase</p>
            <p className={styles.artworkLine}>{artwork.title} · ${artwork.price}</p>
          </div>
          <button className={styles.x} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <hr className={styles.rule} />
          <p className={styles.sectionLabel}>Shipping information</p>
          <input className={styles.input} placeholder="Full name" required value={form.name} onChange={update('name')} />
          <input className={styles.input} placeholder="Email address" type="email" required value={form.email} onChange={update('email')} />
          <input className={styles.input} placeholder="Street address" required value={form.line1} onChange={update('line1')} />
          <div className={styles.row}>
            <input className={styles.input} placeholder="City" required value={form.city} onChange={update('city')} />
            <input className={`${styles.input} ${styles.narrow}`} placeholder="State" required value={form.state} onChange={update('state')} />
            <input className={`${styles.input} ${styles.narrow}`} placeholder="ZIP" required value={form.postal_code} onChange={update('postal_code')} />
          </div>

          <hr className={styles.rule} />
          <p className={styles.sectionLabel}>Payment</p>
          <div className={styles.cardWrapper}>
            <CardElement options={CARD_STYLE} />
          </div>

          <p className={styles.shippingNote}>
            Shipping will be confirmed after purchase — Lillian will be in touch regarding delivery.
          </p>

          {status === 'error' && <p className={styles.error}>{errorMessage}</p>}

          <button className={styles.payBtn} type="submit" disabled={!stripe || status === 'submitting'}>
            {status === 'submitting' ? 'Processing…' : `Pay $${artwork.price}`}
          </button>

          <p className={styles.secure}>🔒 Secure payment via Stripe</p>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/PurchaseModal.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 24, 0.45);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 640px) {
  .overlay { align-items: center; }
}

.modal {
  background: var(--color-bg);
  width: 100%;
  max-width: 500px;
  max-height: 92vh;
  overflow-y: auto;
  padding: var(--space-md);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-sm);
}

.modalLabel {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
  margin-bottom: 0.3rem;
}

.artworkLine {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 300;
}

.x {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--color-muted);
  padding: 0;
  line-height: 1;
}
.x:hover { color: var(--color-text); }

.form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.rule {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0.25rem 0;
}

.sectionLabel {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.input {
  width: 100%;
  border: 1px solid var(--color-border);
  background: transparent;
  padding: 0.6rem 0.75rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 300;
  color: var(--color-text);
  outline: none;
}
.input:focus { border-color: var(--color-text); }

.row { display: flex; gap: 0.65rem; }
.row .input { flex: 1; }
.narrow { flex: 0 0 5.5rem !important; }

.cardWrapper {
  border: 1px solid var(--color-border);
  padding: 0.75rem;
}

.shippingNote {
  font-size: 0.75rem;
  color: var(--color-muted);
  font-style: italic;
  line-height: 1.5;
}

.error { font-size: 0.85rem; color: #ef4444; }

.payBtn {
  background: var(--color-text);
  color: var(--color-bg);
  border: none;
  padding: 0.85rem;
  font-size: 0.72rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  width: 100%;
  transition: opacity 0.2s;
  margin-top: 0.25rem;
}
.payBtn:hover:not(:disabled) { opacity: 0.8; }
.payBtn:disabled { opacity: 0.5; cursor: default; }

.secure {
  font-size: 0.72rem;
  color: var(--color-muted);
  text-align: center;
}

.success {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
}
.success h2 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 300;
}
.success p { font-size: 0.9rem; color: var(--color-muted); line-height: 1.6; }

.closeBtn {
  background: none;
  border: 1px solid var(--color-border);
  padding: 0.6rem 1.5rem;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  width: fit-content;
}
.closeBtn:hover { border-color: var(--color-text); }
```

- [ ] **Step 6: Create `src/app/work/[slug]/PurchaseButton.tsx`**

```typescript
'use client'

import { useState } from 'react'
import StripeProvider from '@/components/StripeProvider'
import PurchaseModal from '@/components/PurchaseModal'
import type { Artwork } from '@/data/catalog'
import styles from './page.module.css'

type Props = { artwork: Artwork }

export default function PurchaseButton({ artwork }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className={styles.button} onClick={() => setOpen(true)}>
        Purchase
      </button>
      {open && (
        <StripeProvider>
          <PurchaseModal artwork={artwork} onClose={() => setOpen(false)} />
        </StripeProvider>
      )}
    </>
  )
}
```

- [ ] **Step 7: Wire PurchaseButton into `src/app/work/[slug]/page.tsx`**

Add this import at the top of the file (after the existing imports):

```typescript
import PurchaseButton from './PurchaseButton'
```

Replace the `purchaseBlock` content for available artworks:

```typescript
// Old:
<button className={styles.button} disabled>Purchase</button>

// New:
<PurchaseButton artwork={artwork} />
```

The full updated `purchaseBlock` JSX should read:

```typescript
<div className={styles.purchaseBlock}>
  {artwork.available ? (
    <>
      <p className={styles.price}>${artwork.price}</p>
      <PurchaseButton artwork={artwork} />
    </>
  ) : (
    <p className={styles.sold}>Sold</p>
  )}
</div>
```

- [ ] **Step 8: Run tests**

```bash
npm test -- --testPathPattern=PurchaseModal
```

Expected: PASS — 3 tests passing

- [ ] **Step 9: Run all tests**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 10: Verify end-to-end checkout in browser**

```bash
npm run dev
```

1. Go to http://localhost:3000/work/untitled-no-1
2. Click **Purchase** — modal slides up
3. Fill in any name/email/address
4. Use Stripe test card: **4242 4242 4242 4242** · any future expiry · any CVC
5. Click **Pay $480** — should transition to success confirmation
6. Check https://dashboard.stripe.com/test/payments — payment should appear with metadata

- [ ] **Step 11: Commit**

```bash
git add src/components/StripeProvider.tsx src/components/PurchaseModal.tsx src/components/PurchaseModal.module.css "src/app/work/[slug]/PurchaseButton.tsx" "src/app/work/[slug]/page.tsx" src/__tests__/PurchaseModal.test.tsx
git commit -m "feat: add purchase modal with Stripe Elements checkout"
```

---

## Task 10: About Page

**Files:**
- Create: `src/app/about/page.tsx`
- Create: `src/app/about/page.module.css`

- [ ] **Step 1: Create `src/app/about/page.tsx`**

```typescript
import styles from './page.module.css'

export const metadata = { title: 'About — Lillian MacKinney' }

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.name}>Lillian MacKinney</h1>
        <div className={styles.bio}>
          <p>
            {/* Replace with Lillian's actual bio */}
            Lillian MacKinney is an artist working in charcoal, Indian ink, and oil.
            Her practice explores form, light, and the quiet geometry of the observed world.
          </p>
          <p>
            {/* Replace with additional context as needed */}
            Based in [City].
          </p>
        </div>
        <p className={styles.contact}>
          <a href="mailto:contact@lillianmackinney.com">contact@lillianmackinney.com</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/about/page.module.css`**

```css
.page {
  padding: var(--space-xl) var(--space-md);
  max-width: var(--max-width);
  margin: 0 auto;
}

.content {
  max-width: 540px;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.name {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 300;
  font-style: italic;
}

.bio {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.bio p {
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--color-muted);
}

.contact a {
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1px;
}

.contact a:hover { border-color: var(--color-text); }
```

- [ ] **Step 3: Replace the placeholder bio**

Before deploying, edit `src/app/about/page.tsx` with Lillian's real artist statement and city. Remove the `{/* Replace... */}` comments.

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Navigate to http://localhost:3000/about. Name, bio, and contact link should display correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/about/page.tsx src/app/about/page.module.css
git commit -m "feat: add about page"
```

---

## Task 11: Vercel Deployment + Domain Configuration

**No code changes — deployment and DNS only.**

- [ ] **Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

- [ ] **Step 2: Initial deploy**

```bash
vercel
```

When prompted:
- Set up and deploy? → **Y**
- Scope → select your account
- Link to existing project? → **N**
- Project name → `lillian-website` (or preferred)
- Directory → `./`
- Override settings? → **N**

Vercel returns a preview URL (e.g., `https://lillian-website-abc123.vercel.app`). Test it.

- [ ] **Step 3: Set environment variables in Vercel**

```bash
vercel env add STRIPE_SECRET_KEY
# Enter value: sk_live_YOUR_LIVE_SECRET_KEY
# Select environments: Production

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Enter value: pk_live_YOUR_LIVE_PUBLISHABLE_KEY
# Select environments: Production
```

For Preview environments, use test keys:

```bash
vercel env add STRIPE_SECRET_KEY
# Enter value: sk_test_YOUR_TEST_KEY
# Select environments: Preview, Development

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Enter value: pk_test_YOUR_TEST_PUBLISHABLE_KEY
# Select environments: Preview, Development
```

- [ ] **Step 4: Deploy to production**

```bash
vercel --prod
```

Note the production URL (e.g., `https://lillian-website.vercel.app`).

- [ ] **Step 5: Add custom domain in Vercel dashboard**

1. Go to https://vercel.com → your project → **Settings → Domains**
2. Add `lillianmackinney.com` → click **Add**
3. Add `www.lillianmackinney.com` → click **Add**
4. Vercel displays the required DNS records

- [ ] **Step 6: Configure DNS at your domain registrar**

At whichever registrar holds `lillianmackinney.com`, add:

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

DNS propagation is typically 15–30 minutes, up to 48 hours.

- [ ] **Step 7: Enable Stripe email receipts**

1. Go to https://dashboard.stripe.com → **Settings → Emails**
2. Enable **Successful payments** receipts
3. Optionally set a custom logo and business name under **Branding**

This sends buyers an automatic Stripe-branded receipt to the email they entered at checkout. Zero extra code.

- [ ] **Step 8: Verify the live site**

Once DNS propagates:
1. Visit https://lillianmackinney.com
2. Navigate Work, About
3. Click a piece → verify detail page
4. Click Purchase → verify modal opens and Stripe loads correctly
5. Do a test purchase on the preview environment (which uses test keys) to confirm the full flow

- [ ] **Step 9: Push and confirm auto-deploy**

```bash
git push origin main
```

Vercel auto-deploys on every push to `main`. Future updates (new artwork, bio changes) deploy automatically on push.

---

## Adding New Artwork (Ongoing Reference)

When Lillian has a new piece to list:

1. Prepare the image: resize to max 1800px longest edge, save as JPEG ~85% quality
2. Copy to `public/images/[slug].jpg`
3. Add an entry to `src/data/catalog.ts`:
   ```typescript
   {
     slug: 'new-piece-slug',
     title: 'New Piece Title',
     year: 2025,
     medium: 'Oil on canvas',
     dimensions: '16 × 20 in',
     price: 600,
     available: true,
     image: '/images/new-piece-slug.jpg',
   }
   ```
4. Commit and push:
   ```bash
   git add public/images/new-piece-slug.jpg src/data/catalog.ts
   git commit -m "feat: add [Title] to catalog"
   git push origin main
   ```
   Vercel deploys automatically.

To mark a piece as sold: set `available: false` in `catalog.ts` and push.
