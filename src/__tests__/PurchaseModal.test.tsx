import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PurchaseModal from '@/components/PurchaseModal'
import type { Artwork } from '@/data/catalog'

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({})),
}))

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({ confirmPayment: jest.fn() }),
  useElements: () => ({}),
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

function fillShippingForm() {
  fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Jane Buyer' } })
  fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'jane@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Street address'), { target: { value: '123 Main St' } })
  fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Milwaukee' } })
  fireEvent.change(screen.getByPlaceholderText('State'), { target: { value: 'WI' } })
  fireEvent.change(screen.getByPlaceholderText('ZIP'), { target: { value: '53202' } })
}

describe('PurchaseModal', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

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

  test('advances to payment step with totals after shipping details', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        clientSecret: 'pi_test_secret',
        totals: { subtotal: 40000, shipping: 2500, tax: 2200, total: 44700 },
      }),
    }) as jest.Mock

    render(<PurchaseModal artwork={mockArtwork} onClose={() => {}} />)
    fillShippingForm()
    fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }))

    await waitFor(() => expect(screen.getByTestId('payment-element')).toBeInTheDocument())
    expect(screen.getByText('$400.00')).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.getByText('$22.00')).toBeInTheDocument()
    expect(screen.getByText('$447.00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pay \$447\.00/i })).toBeInTheDocument()
  })

  test('shows the API error and stays on details step when setup fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Artwork is not available' }),
    }) as jest.Mock

    render(<PurchaseModal artwork={mockArtwork} onClose={() => {}} />)
    fillShippingForm()
    fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }))

    await waitFor(() => expect(screen.getByText('Artwork is not available')).toBeInTheDocument())
    expect(screen.queryByTestId('payment-element')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument()
  })
})
