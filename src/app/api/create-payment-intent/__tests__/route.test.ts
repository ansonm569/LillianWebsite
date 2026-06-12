/**
 * @jest-environment node
 */
import { POST } from '../route'
import { NextRequest } from 'next/server'

const mockCreate = jest.fn()
const mockTaxCalculate = jest.fn()

jest.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    paymentIntents: { create: mockCreate },
    tax: { calculations: { create: mockTaxCalculate } },
  }),
}))

jest.mock('@/data/catalog', () => ({
  getArtwork: jest.fn((slug: string) => {
    if (slug === 'available-piece') {
      return { slug: 'available-piece', title: 'A Piece', medium: 'Charcoal on paper', price: 400, available: true }
    }
    if (slug === 'sold-piece') {
      return { slug: 'sold-piece', title: 'Sold', medium: 'Oil on canvas', price: 200, available: false }
    }
    return undefined
  }),
}))

// Each request gets a unique IP by default so the in-memory rate limiter
// doesn't bleed across unrelated tests.
let ipCounter = 0

function makeRequest(body: object, ip?: string) {
  return new NextRequest('http://localhost/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip ?? `10.0.0.${++ipCounter}`,
    },
  })
}

const validAddress = { line1: '123 Main St', city: 'Milwaukee', state: 'WI', postal_code: '53202', country: 'US' }

const validBody = {
  slug: 'available-piece',
  name: 'Jane Buyer',
  email: 'jane@example.com',
  address: validAddress,
}

// $400 artwork → 40000c subtotal; charcoal on paper → 2500c tube shipping.
const TAX_CALCULATION = {
  id: 'taxcalc_123',
  tax_amount_exclusive: 2338,
  amount_total: 44838,
}

describe('POST /api/create-payment-intent', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockCreate.mockResolvedValue({ client_secret: 'pi_test_secret_123' })
    mockTaxCalculate.mockReset()
    mockTaxCalculate.mockResolvedValue(TAX_CALCULATION)
  })

  test('returns clientSecret and totals for valid available artwork', async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.clientSecret).toBe('pi_test_secret_123')
    expect(json.totals).toEqual({ subtotal: 40000, shipping: 2500, tax: 2338, total: 44838 })
  })

  test('calculates tax from the shipping address with shipping cost included', async () => {
    await POST(makeRequest(validBody))
    expect(mockTaxCalculate).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'usd',
        line_items: [expect.objectContaining({ amount: 40000, reference: 'available-piece' })],
        shipping_cost: { amount: 2500 },
        customer_details: expect.objectContaining({
          address: expect.objectContaining({ postal_code: '53202', state: 'WI' }),
          address_source: 'shipping',
        }),
      })
    )
  })

  test('charges the tax-calculation total and records the calculation id', async () => {
    await POST(makeRequest(validBody))
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 44838,
        automatic_payment_methods: { enabled: true },
        metadata: expect.objectContaining({ tax_calculation: 'taxcalc_123' }),
      })
    )
  })

  test('passes shipping name and address to Stripe', async () => {
    await POST(makeRequest(validBody))
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        shipping: { name: 'Jane Buyer', address: validAddress },
      })
    )
  })

  test('falls back to charging without tax when Stripe Tax is unavailable', async () => {
    mockTaxCalculate.mockRejectedValueOnce(new Error('Stripe Tax has not been activated'))
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(makeRequest(validBody))
    consoleError.mockRestore()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.totals).toEqual({ subtotal: 40000, shipping: 2500, tax: 0, total: 42500 })
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ amount: 42500 }))
    const metadata = mockCreate.mock.calls[0][0].metadata
    expect(metadata.tax_calculation).toBeUndefined()
  })

  test('returns 400 asking to check the address when tax location is invalid', async () => {
    mockTaxCalculate.mockRejectedValueOnce(
      Object.assign(new Error('invalid location'), { code: 'customer_tax_location_invalid' })
    )
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('address')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  test('returns 404 for unknown artwork slug', async () => {
    const res = await POST(makeRequest({ ...validBody, slug: 'unknown' }))
    expect(res.status).toBe(404)
  })

  test('returns 400 for sold artwork', async () => {
    const res = await POST(makeRequest({ ...validBody, slug: 'sold-piece' }))
    expect(res.status).toBe(400)
  })

  test('returns 400 for missing required fields', async () => {
    const res = await POST(makeRequest({ slug: 'available-piece', name: 'x', email: 'x@x.com' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing required fields')
  })

  test('returns 400 for invalid email address', async () => {
    const res = await POST(makeRequest({ ...validBody, email: 'not-an-email' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid email address')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  test('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/create-payment-intent', {
      method: 'POST',
      body: '{bad json}',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.0.0.${++ipCounter}` },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('returns 500 with a generic message when Stripe throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Internal Stripe detail'))
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(makeRequest(validBody))
    consoleError.mockRestore()
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).not.toContain('Internal Stripe detail')
  })

  test('rate limits repeated requests from the same IP', async () => {
    const ip = '203.0.113.50'
    let lastStatus = 0
    for (let i = 0; i < 11; i++) {
      const res = await POST(makeRequest(validBody, ip))
      lastStatus = res.status
    }
    expect(lastStatus).toBe(429)
  })
})
