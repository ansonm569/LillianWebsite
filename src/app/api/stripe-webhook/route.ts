import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { Resend } from 'resend'
import { getStripe } from '@/lib/stripe'

const NOTIFY_EMAIL = 'contact@lillianmackinney.com'

function formatSaleEmail(intent: Stripe.PaymentIntent): string {
  const { artwork_title, artwork_slug, buyer_name, buyer_email } = intent.metadata
  const amount = (intent.amount_received / 100).toFixed(2)
  const addr = intent.shipping?.address

  return [
    `Artwork: ${artwork_title ?? 'Unknown'} (${artwork_slug ?? 'unknown'})`,
    `Amount: $${amount} ${intent.currency.toUpperCase()}`,
    `Buyer: ${buyer_name ?? 'Unknown'} <${buyer_email ?? 'unknown'}>`,
    '',
    'Ship to:',
    intent.shipping?.name ?? buyer_name ?? 'Unknown',
    addr?.line1,
    `${addr?.city ?? ''}, ${addr?.state ?? ''} ${addr?.postal_code ?? ''}`,
    addr?.country,
    '',
    `Stripe payment: https://dashboard.stripe.com/payments/${intent.id}`,
    '',
    'Remember to mark this piece as sold in the catalog.',
  ].filter(line => line != null).join('\n')
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const payload = await req.text()
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object
    console.log(`Payment succeeded: ${intent.id} — ${intent.metadata.artwork_slug}`)

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error('RESEND_API_KEY is not set — sale notification email skipped for', intent.id)
      return NextResponse.json({ received: true })
    }

    const resend = new Resend(resendKey)
    const { error } = await resend.emails.send({
      from: 'Sales <onboarding@resend.dev>',
      to: NOTIFY_EMAIL,
      subject: `Sold: ${intent.metadata.artwork_title ?? 'artwork'} — $${(intent.amount_received / 100).toFixed(2)}`,
      text: formatSaleEmail(intent),
    })
    if (error) {
      console.error('Sale notification email failed:', error)
      // Non-200 makes Stripe retry the webhook, so the notification isn't lost.
      return NextResponse.json({ error: 'Notification failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
