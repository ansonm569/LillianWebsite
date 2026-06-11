import Image from 'next/image'
import Link from 'next/link'
import type { Artwork } from '@/data/catalog'
import styles from './ArtworkCard.module.css'

type Props = { artwork: Artwork }

export default function ArtworkCard({ artwork }: Props) {
  return (
    <Link href={`/work/${artwork.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={artwork.image}
          alt={artwork.title}
          width={600}
          height={800}
          style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
        />
        {!artwork.available && (
          <span className={styles.soldBadge}>Sold</span>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.title}>{artwork.title}</span>
        {artwork.available && (
          <span className={styles.price}>${artwork.price}</span>
        )}
      </div>
    </Link>
  )
}
