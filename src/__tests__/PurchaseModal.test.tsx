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
  imageWidth: 1800,
  imageHeight: 1800,
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
