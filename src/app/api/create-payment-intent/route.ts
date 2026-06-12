import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getArtwork } from '@/data/catalog'
import { shippingCents } from '@/lib/shipping'
import { clientIp, rateLimit } from '@/lib/rate-limit'

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

// Stripe Tax only charges tax in jurisdictions registered in the dashboard
// (Settings → Tax → Registrations). If Stripe Tax isn't activated on the
// account, we log loudly and fall back to charging no tax rather than
// blocking the sale.
async function calculateTax(
  amount: number,
  shipping: number,
  slug: string,
  address: ShippingAddress
): Promise<{ taxCents: number; totalCents: number; calculationId: string | null } | { addressError: string }> {
  try {
    const calculation = await getStripe().tax.calculations.create({
      currency: 'usd',
      line_items: [
        {
          amount,
          reference: slug,
          tax_code: 'txcd_99999999', // general tangible goods
          tax_behavior: 'exclusive',
        },
      ],
      shipping_cost: { amount: shipping },
      customer_details: {
        address: {
          line1: address.line1,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        },
        address_source: 'shipping',
      },
    })
    return {
      taxCents: calculation.tax_amount_exclusive,
      totalCents: calculation.amount_total,
      calculationId: calculation.id,
    }
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : undefined
    if (code === 'customer_tax_location_invalid') {
      return { addressError: 'We could not verify that address — please double-check it and try again.' }
    }
    console.error('Stripe Tax calculation failed — proceeding without tax:', err)
    return { taxCents: 0, totalCents: amount + shipping, calculationId: null }
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`pi:${clientIp(req.headers)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests — please try again shortly.' }, { status: 429 })
  }

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

  const subtotal = Math.round(artwork.price * 100)
  const shipping = shippingCents(artwork)

  const tax = await calculateTax(subtotal, shipping, slug, address)
  if ('addressError' in tax) {
    return NextResponse.json({ error: tax.addressError }, { status: 400 })
  }

  try {
    const metadata: Stripe.MetadataParam = {
      artwork_slug: slug,
      artwork_title: artwork.title,
      buyer_name: name,
      buyer_email: email,
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      tax_cents: tax.taxCents,
    }
    if (tax.calculationId) metadata.tax_calculation = tax.calculationId

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: tax.totalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
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
      metadata,
    })

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      totals: {
        subtotal,
        shipping,
        tax: tax.taxCents,
        total: tax.totalCents,
      },
    })
  } catch (err) {
    console.error('PaymentIntent creation failed:', err)
    return NextResponse.json({ error: 'Payment setup failed — please try again.' }, { status: 500 })
  }
}
