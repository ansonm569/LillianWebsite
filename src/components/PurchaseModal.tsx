'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import type { Appearance } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { Artwork } from '@/data/catalog'
import styles from './PurchaseModal.module.css'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// With a null stripe instance, Elements still renders but payment stays
// disabled instead of crashing the page.
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

if (!publishableKey) {
  console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set — payments are disabled')
}

const APPEARANCE: Appearance = {
  variables: {
    colorPrimary: '#1a1a18',
    colorText: '#1a1a18',
    colorDanger: '#ef4444',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizeBase: '15px',
    borderRadius: '0px',
  },
}

type Props = { artwork: Artwork; onClose: () => void; onSuccess?: () => void }

type FormState = {
  name: string; email: string; line1: string
  city: string; state: string; postal_code: string; country: string
}

type Totals = { subtotal: number; shipping: number; tax: number; total: number }

type Step = 'details' | 'payment' | 'success'

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function PurchaseModal({ artwork, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('details')
  const [form, setForm] = useState<FormState>({
    name: '', email: '', line1: '', city: '', state: '', postal_code: '', country: 'US',
  })
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [totals, setTotals] = useState<Totals | null>(null)

  function update(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  // Closing is blocked mid-request; onSuccess fires only once the buyer has
  // seen the confirmation screen and dismisses it.
  function handleClose() {
    if (busy) return
    if (step === 'success') onSuccess?.()
    onClose()
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: artwork.slug,
          name: form.name,
          email: form.email,
          address: {
            line1: form.line1,
            city: form.city,
            state: form.state,
            postal_code: form.postal_code,
            country: form.country,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Payment setup failed')
      setClientSecret(data.clientSecret)
      setTotals(data.totals)
      setStep('payment')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'success') {
    return (
      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.success}>
            <h2>Thank you</h2>
            <p>
              Your purchase of <em>{artwork.title}</em> is confirmed.
              A receipt has been sent to {form.email}.
            </p>
            <button className={styles.closeBtn} onClick={handleClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p className={styles.modalLabel}>Complete your purchase</p>
            <p className={styles.artworkLine}><span>{artwork.title}</span> · <span>${artwork.price}</span></p>
          </div>
          <button className={styles.x} onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} className={styles.form}>
            <hr className={styles.rule} />
            <p className={styles.sectionLabel}>Shipping information</p>
            <input className={styles.input} placeholder="Full name" required autoComplete="name" value={form.name} onChange={update('name')} />
            <input className={styles.input} placeholder="Email address" type="email" required autoComplete="email" value={form.email} onChange={update('email')} />
            <input className={styles.input} placeholder="Street address" required autoComplete="address-line1" value={form.line1} onChange={update('line1')} />
            <div className={styles.row}>
              <input className={styles.input} placeholder="City" required autoComplete="address-level2" value={form.city} onChange={update('city')} />
              <input className={`${styles.input} ${styles.narrow}`} placeholder="State" required autoComplete="address-level1" value={form.state} onChange={update('state')} />
              <input className={`${styles.input} ${styles.narrow}`} placeholder="ZIP" required autoComplete="postal-code" value={form.postal_code} onChange={update('postal_code')} />
            </div>

            <p className={styles.shippingNote}>
              Shipping and any applicable sales tax are calculated from your address in the next step.
            </p>

            {errorMessage && <p className={styles.error}>{errorMessage}</p>}

            <button className={styles.payBtn} type="submit" disabled={busy}>
              {busy ? 'Calculating…' : 'Continue to payment'}
            </button>

            <p className={styles.secure}>🔒 Secure payment via Stripe</p>
          </form>
        )}

        {step === 'payment' && totals && (
          <div className={styles.form}>
            <hr className={styles.rule} />
            <div className={styles.totals}>
              <div className={styles.totalsRow}><span>Subtotal</span><span>{dollars(totals.subtotal)}</span></div>
              <div className={styles.totalsRow}><span>Shipping</span><span>{dollars(totals.shipping)}</span></div>
              {totals.tax > 0 && (
                <div className={styles.totalsRow}><span>Sales tax</span><span>{dollars(totals.tax)}</span></div>
              )}
              <div className={styles.totalRow}><span>Total</span><span>{dollars(totals.total)}</span></div>
            </div>

            <hr className={styles.rule} />
            <p className={styles.sectionLabel}>Payment</p>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: APPEARANCE }}>
              <PaymentForm artworkSlug={artwork.slug} total={totals.total} onPaid={() => setStep('success')} onBusyChange={setBusy} />
            </Elements>

            <button className={styles.backBtn} type="button" disabled={busy} onClick={() => setStep('details')}>
              ← Edit shipping details
            </button>

            <p className={styles.secure}>🔒 Secure payment via Stripe</p>
          </div>
        )}
      </div>
    </div>
  )
}

type PaymentFormProps = {
  artworkSlug: string
  total: number
  onPaid: () => void
  onBusyChange: (busy: boolean) => void
}

function PaymentForm({ artworkSlug, total, onPaid, onBusyChange }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    onBusyChange(true)
    setMessage('')

    // Cards and wallets confirm in place; redirect-based methods return the
    // buyer to the artwork page with a redirect_status query param, which
    // PurchaseButton picks up to show confirmation.
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/work/${artworkSlug}`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setMessage(error.message ?? 'Payment failed — please try again')
      setSubmitting(false)
      onBusyChange(false)
    } else {
      onBusyChange(false)
      onPaid()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <PaymentElement />
      {message && <p className={styles.error}>{message}</p>}
      <button className={styles.payBtn} type="submit" disabled={!stripe || submitting}>
        {submitting ? 'Processing…' : `Pay ${dollars(total)}`}
      </button>
    </form>
  )
}
