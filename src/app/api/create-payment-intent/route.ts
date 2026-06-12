import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { slug, name, email, address } = body

  if (!slug || !name || !email || !address?.line1 || !address?.city || !address?.state || !address?.postal_code || !address?.country) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const artwork = getArtwork(slug)
  if (!artwork) {
    return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
  }
  if (!artwork.available) {
    return NextResponse.json({ error: 'Artwork is not available' }, { status: 400 })
  }

  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(artwork.price * 100),
      currency: 'usd',
      payment_method_types: ['card'],
      receipt_email: email,
      description: `Artwork purchase: ${artwork.title}`,
      shipping: {
        name,
        address: {
          line1: address.line1,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        },
      },
      metadata: {
        artwork_slug: slug,
        artwork_title: artwork.title,
        buyer_name: name,
        buyer_email: email,
      },
    })

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('PaymentIntent creation failed:', err)
    return NextResponse.json({ error: 'Payment setup failed — please try again.' }, { status: 500 })
  }
}
