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
