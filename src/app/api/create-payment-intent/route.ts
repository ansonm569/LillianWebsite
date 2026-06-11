import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
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
  const { slug, name, email, address }: Body = await req.json()

  const artwork = getArtwork(slug)
  if (!artwork) {
    return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
  }
  if (!artwork.available) {
    return NextResponse.json({ error: 'Artwork is not available' }, { status: 400 })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: artwork.price * 100,
    currency: 'usd',
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

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
