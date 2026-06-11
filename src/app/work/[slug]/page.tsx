import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { catalog, getArtwork } from '@/data/catalog'
import styles from './page.module.css'

type Props = { params: { slug: string } }

export function generateStaticParams() {
  return catalog.map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props) {
  const artwork = getArtwork(params.slug)
  if (!artwork) return {}
  return { title: `${artwork.title} — Lillian MacKinney` }
}

export default function PiecePage({ params }: Props) {
  const artwork = getArtwork(params.slug)
  if (!artwork) notFound()

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <div className={styles.imageCol}>
          <Image
            src={artwork.image}
            alt={artwork.title}
            width={900}
            height={1200}
            style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
            priority
          />
        </div>
        <div className={styles.infoCol}>
          <h1 className={styles.title}>{artwork.title}</h1>
          <p className={styles.meta}>{artwork.year}</p>
          <p className={styles.meta}>{artwork.medium}</p>
          <p className={styles.meta}>{artwork.dimensions}</p>
          {artwork.description && (
            <p className={styles.description}>{artwork.description}</p>
          )}
          <div className={styles.purchaseBlock}>
            {artwork.available ? (
              <>
                <p className={styles.price}>${artwork.price}</p>
                {/* Replace with <PurchaseButton artwork={artwork} /> in Task 9 */}
                <button className={styles.button} disabled>Purchase</button>
              </>
            ) : (
              <p className={styles.sold}>Sold</p>
            )}
          </div>
          <Link href="/work" className={styles.back}>← Back to Work</Link>
        </div>
      </div>
    </div>
  )
}
