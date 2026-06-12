import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { Resend } from 'resend'
import { getStripe } from '@/lib/stripe'

const NOTIFY_EMAIL = 'contact@lillianmackinney.com'
// Until the domain is verified in Resend, the sandbox sender only delivers
// to the Resend account owner's address. Set EMAIL_FROM once verified.
const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

function dollars(cents: string | number | undefined): string | null {
  if (cents === undefined) return null
  const n = Number(cents)
  return Number.isFinite(n) ? `$${(n / 100).toFixed(2)}` : null
}

function formatSaleEmail(intent: Stripe.PaymentIntent): string {
  const m = intent.metadata
  const addr = intent.shipping?.address

  const subtotal = dollars(m.subtotal_cents)
  const shipping = dollars(m.shipping_cents)
  const tax = dollars(m.tax_cents)

  return [
    `Artwork: ${m.artwork_title ?? 'Unknown'} (${m.artwork_slug ?? 'unknown'})`,
    subtotal && `Subtotal: ${subtotal}`,
    shipping && `Shipping: ${shipping}`,
    tax && `Sales tax: ${tax}`,
    `Total charged: $${(intent.amount_received / 100).toFixed(2)} ${intent.currency.toUpperCase()}`,
    `Buyer: ${m.buyer_name ?? 'Unknown'} <${m.buyer_email ?? 'unknown'}>`,
    '',
    'Ship to:',
    intent.shipping?.name ?? m.buyer_name ?? 'Unknown',
    addr?.line1,
    `${addr?.city ?? ''}, ${addr?.state ?? ''} ${addr?.postal_code ?? ''}`,
    addr?.country,
    '',
    `Stripe payment: https://dashboard.stripe.com/payments/${intent.id}`,
    '',
    'Remember to mark this piece as sold in the catalog.',
  ].filter(line => line != null).join('\n')
}

// Records the sale with Stripe Tax so it appears in tax reports. Failures are
// logged but don't fail the webhook — on Stripe's retry the duplicate
// reference is rejected and logged again, while the email still goes out.
async function recordTaxTransaction(intent: Stripe.PaymentIntent) {
  const calculationId = intent.metadata.tax_calculation
  if (!calculationId) return

  try {
    await getStripe().tax.transactions.createFromCalculation({
      calculation: calculationId,
      reference: intent.id,
    })
  } catch (err) {
    console.error(`Tax transaction for ${intent.id} failed:`, err)
  }
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

    await recordTaxTransaction(intent)

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error('RESEND_API_KEY is not set — sale notification email skipped for', intent.id)
      return NextResponse.json({ received: true })
    }

    const resend = new Resend(resendKey)
    const { error } = await resend.emails.send({
      from: `Sales <${FROM_ADDRESS}>`,
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
