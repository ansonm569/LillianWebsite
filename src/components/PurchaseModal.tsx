'use client'

import { useEffect, useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { Artwork } from '@/data/catalog'
import styles from './PurchaseModal.module.css'

type Props = { artwork: Artwork; onClose: () => void; onSuccess?: () => void }

type FormState = {
  name: string; email: string; line1: string
  city: string; state: string; postal_code: string; country: string
}

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1a1a18',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '300',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
}

export default function PurchaseModal({ artwork, onClose, onSuccess }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [form, setForm] = useState<FormState>({
    name: '', email: '', line1: '', city: '', state: '', postal_code: '', country: 'US',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function update(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  // Closing is blocked mid-payment; onSuccess fires only once the buyer has
  // seen the confirmation screen and dismisses it.
  function handleClose() {
    if (status === 'submitting') return
    if (status === 'success') onSuccess?.()
    onClose()
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setStatus('submitting')
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
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Payment setup failed')
      }
      const { clientSecret } = await res.json()
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element unavailable — please refresh and try again')
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: form.name, email: form.email },
        },
      })
      if (error) throw new Error(error.message ?? 'Payment failed — please try again')
      setStatus('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred')
      setStatus('error')
    }
  }

  if (status === 'success') {
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

        <form onSubmit={handleSubmit} className={styles.form}>
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

          <hr className={styles.rule} />
          <p className={styles.sectionLabel}>Payment</p>
          <div className={styles.cardWrapper}>
            <CardElement options={CARD_STYLE} />
          </div>

          <p className={styles.shippingNote}>
            Shipping will be confirmed after purchase — Lillian will be in touch regarding delivery.
          </p>

          {status === 'error' && <p className={styles.error}>{errorMessage}</p>}

          <button className={styles.payBtn} type="submit" disabled={!stripe || status === 'submitting'}>
            {status === 'submitting' ? 'Processing…' : `Pay $${artwork.price}`}
          </button>

          <p className={styles.secure}>🔒 Secure payment via Stripe</p>
        </form>
      </div>
    </div>
  )
}
