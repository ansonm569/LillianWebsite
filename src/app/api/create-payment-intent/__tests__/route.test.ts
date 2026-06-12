/**
 * @jest-environment node
 */
import { POST } from '../route'
import { NextRequest } from 'next/server'

const mockCreate = jest.fn()

jest.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    paymentIntents: {
      create: mockCreate,
    },
  }),
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

const validAddress = { line1: '123 Main St', city: 'Portland', state: 'OR', postal_code: '97201', country: 'US' }

const validBody = {
  slug: 'available-piece',
  name: 'Jane Buyer',
  email: 'jane@example.com',
  address: validAddress,
}

describe('POST /api/create-payment-intent', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockCreate.mockResolvedValue({ client_secret: 'pi_test_secret_123' })
  })

  test('returns clientSecret for valid available artwork', async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.clientSecret).toBe('pi_test_secret_123')
  })

  test('passes payment_method_types card to Stripe', async () => {
    await POST(makeRequest(validBody))
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_method_types: ['card'] })
    )
  })

  test('rounds price to integer cents', async () => {
    await POST(makeRequest(validBody))
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 40000 })
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
      headers: { 'Content-Type': 'application/json' },
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
})
