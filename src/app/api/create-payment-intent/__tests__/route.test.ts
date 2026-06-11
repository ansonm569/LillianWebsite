/**
 * @jest-environment node
 */
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'

jest.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: 'pi_test_secret_123' }),
    },
  },
}))

const mockCreate = stripe.paymentIntents.create as jest.Mock

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

describe('POST /api/create-payment-intent', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockCreate.mockResolvedValue({ client_secret: 'pi_test_secret_123' })
  })

  test('returns clientSecret for valid available artwork', async () => {
    const req = makeRequest({
      slug: 'available-piece',
      name: 'Jane Buyer',
      email: 'jane@example.com',
      address: validAddress,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.clientSecret).toBe('pi_test_secret_123')
  })

  test('passes payment_method_types card to Stripe', async () => {
    const req = makeRequest({
      slug: 'available-piece',
      name: 'Jane Buyer',
      email: 'jane@example.com',
      address: validAddress,
    })
    await POST(req)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_method_types: ['card'] })
    )
  })

  test('rounds price to integer cents', async () => {
    const req = makeRequest({
      slug: 'available-piece',
      name: 'Jane Buyer',
      email: 'jane@example.com',
      address: validAddress,
    })
    await POST(req)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 40000 })
    )
  })

  test('returns 404 for unknown artwork slug', async () => {
    const req = makeRequest({ slug: 'unknown', name: 'x', email: 'x@x.com', address: validAddress })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  test('returns 400 for sold artwork', async () => {
    const req = makeRequest({ slug: 'sold-piece', name: 'x', email: 'x@x.com', address: validAddress })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('returns 400 for missing required fields', async () => {
    const req = makeRequest({ slug: 'available-piece', name: 'x', email: 'x@x.com' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing required fields')
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

  test('returns 500 when Stripe throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Stripe error'))
    const req = makeRequest({
      slug: 'available-piece',
      name: 'Jane Buyer',
      email: 'jane@example.com',
      address: validAddress,
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Stripe error')
  })
})
