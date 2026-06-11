'use client'

import { useState } from 'react'
import StripeProvider from '@/components/StripeProvider'
import PurchaseModal from '@/components/PurchaseModal'
import type { Artwork } from '@/data/catalog'
import styles from './page.module.css'

type Props = { artwork: Artwork }

export default function PurchaseButton({ artwork }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className={styles.button} onClick={() => setOpen(true)}>
        Purchase
      </button>
      {open && (
        <StripeProvider>
          <PurchaseModal artwork={artwork} onClose={() => setOpen(false)} />
        </StripeProvider>
      )}
    </>
  )
}
