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

  test('renders Sold indicators and hides price when not available', () => {
    render(<ArtworkCard artwork={{ ...base, available: false }} />)
    const soldElements = screen.getAllByText('Sold')
    expect(soldElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('$400')).not.toBeInTheDocument()
  })

  test('links to the piece detail page', () => {
    render(<ArtworkCard artwork={base} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/work/test-piece')
  })
})
