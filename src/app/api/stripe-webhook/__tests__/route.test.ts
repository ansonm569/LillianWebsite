/**
 * @jest-environment node
 */
import { POST } from '../route'
import { NextRequest } from 'next/server'

const mockConstructEvent = jest.fn()
const mockSend = jest.fn()

jest.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }),
}))

jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: { send: mockSend },
  })),
}))

function makeRequest(body: string, signature?: string) {
  return new NextRequest('http://localhost/api/stripe-webhook', {
    method: 'POST',
    body,
    headers: signature ? { 'stripe-signature': signature } : {},
  })
}

const succeededEvent = {
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_123',
      amount_received: 40000,
      currency: 'usd',
      metadata: {
        artwork_slug: 'a-piece',
        artwork_title: 'A Piece',
        buyer_name: 'Jane Buyer',
        buyer_email: 'jane@example.com',
      },
      shipping: {
        name: 'Jane Buyer',
        address: { line1: '123 Main St', city: 'Portland', state: 'OR', postal_code: '97201', country: 'US' },
      },
    },
  },
}

describe('POST /api/stripe-webhook', () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    process.env.RESEND_API_KEY = 're_test'
    mockConstructEvent.mockReset()
    mockSend.mockReset()
    mockSend.mockResolvedValue({ error: null })
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns 500 when webhook secret is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const res = await POST(makeRequest('{}', 'sig'))
    expect(res.status).toBe(500)
  })

  test('returns 400 when signature header is missing', async () => {
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(400)
  })

  test('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('bad signature') })
    const res = await POST(makeRequest('{}', 'bad-sig'))
    expect(res.status).toBe(400)
    expect(mockSend).not.toHaveBeenCalled()
  })

  test('sends sale notification email on payment_intent.succeeded', async () => {
    mockConstructEvent.mockReturnValue(succeededEvent)
    const res = await POST(makeRequest('{}', 'good-sig'))
    expect(res.status).toBe(200)
    expect(mockSend).toHaveBeenCalledTimes(1)
    const email = mockSend.mock.calls[0][0]
    expect(email.subject).toContain('A Piece')
    expect(email.text).toContain('Jane Buyer')
    expect(email.text).toContain('123 Main St')
    expect(email.text).toContain('$400.00')
  })

  test('returns 500 so Stripe retries when the notification email fails', async () => {
    mockConstructEvent.mockReturnValue(succeededEvent)
    mockSend.mockResolvedValue({ error: { message: 'rate limited' } })
    const res = await POST(makeRequest('{}', 'good-sig'))
    expect(res.status).toBe(500)
  })

  test('acknowledges unhandled event types without sending email', async () => {
    mockConstructEvent.mockReturnValue({ type: 'charge.refunded', data: { object: {} } })
    const res = await POST(makeRequest('{}', 'good-sig'))
    expect(res.status).toBe(200)
    expect(mockSend).not.toHaveBeenCalled()
  })
})
