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
      metadata: {
        artwork_slug: slug,
        artwork_title: artwork.title,
        buyer_name: name,
        buyer_email: email,
        shipping_line1: address.line1,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_postal_code: address.postal_code,
        shipping_country: address.country,
      },
    })

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment setup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
