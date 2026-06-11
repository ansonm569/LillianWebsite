/**
 * @jest-environment node
 */
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
