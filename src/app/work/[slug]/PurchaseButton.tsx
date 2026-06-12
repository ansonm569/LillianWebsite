'use client'

import { useEffect, useState } from 'react'
import PurchaseModal from '@/components/PurchaseModal'
import type { Artwork } from '@/data/catalog'
import styles from './page.module.css'

type Props = { artwork: Artwork }

export default function PurchaseButton({ artwork }: Props) {
  const [open, setOpen] = useState(false)
  const [sold, setSold] = useState(false)
  const [redirectStatus, setRedirectStatus] = useState<string | null>(null)

  // Redirect-based payment methods (e.g. some wallets) send the buyer back
  // here with a redirect_status query param after confirming.
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('redirect_status')
    // One-time read of browser-only URL state; can't run during server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (status) setRedirectStatus(status)
    if (status === 'succeeded') setSold(true)
  }, [])

  if (sold) {
    return (
      <>
        <p className={styles.sold}>Sold</p>
        {redirectStatus === 'succeeded' && (
          <p className={styles.purchaseNote}>
            Thank you for your purchase — a receipt has been sent to your email.
          </p>
        )}
      </>
    )
  }

  return (
    <>
      {redirectStatus === 'failed' && (
        <p className={styles.purchaseError}>
          Your payment was not completed — please try again.
        </p>
      )}
      <button className={styles.button} onClick={() => setOpen(true)}>
        Purchase
      </button>
      {open && (
        <PurchaseModal
          artwork={artwork}
          onClose={() => setOpen(false)}
          onSuccess={() => setSold(true)}
        />
      )}
    </>
  )
}
