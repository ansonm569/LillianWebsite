'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

// With a null stripe instance, Elements still renders children but useStripe()
// returns null, so the pay button stays disabled instead of crashing the page.
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

if (!publishableKey) {
  console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set — payments are disabled')
}

type Props = { children: React.ReactNode }

export default function StripeProvider({ children }: Props) {
  return <Elements stripe={stripePromise}>{children}</Elements>
}
