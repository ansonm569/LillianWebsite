import Image from 'next/image'
import Link from 'next/link'
import { catalog } from '@/data/catalog'
import styles from './page.module.css'

export default function Home() {
  const featured = catalog.find(a => a.available) ?? catalog[0]

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.imageCol}>
          <Image
            src={featured.image}
            alt={featured.title}
            width={800}
            height={1000}
            style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
            priority
          />
        </div>
        <div className={styles.introCol}>
          <span className={styles.eyebrow}>Milwaukee, WI</span>
          <p className={styles.tagline}>Form, light, and the quiet geometry of the observed world.</p>
          <p className={styles.subline}>
            Original works in charcoal, Indian ink, and oil. Each piece is made by hand and exists as a singular object.
          </p>
          <Link href="/work" className={styles.cta}>View all work →</Link>
        </div>
      </div>

      <div className={styles.selectedSection}>
        <div className={styles.selectedHeader}>
          <span className={styles.selectedTitle}>Selected Work</span>
          <Link href="/work" className={styles.selectedAllLink}>All work →</Link>
        </div>
        <div className={styles.selectedGrid}>
          {catalog.map(artwork => (
            <Link key={artwork.slug} href={`/work/${artwork.slug}`} className={styles.selectedItem}>
              <Image
                src={artwork.image}
                alt={artwork.title}
                width={600}
                height={800}
                style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
              />
              <div className={styles.selectedItemInfo}>
                <span className={styles.selectedItemTitle}>{artwork.title}</span>
                <span className={styles.selectedItemPrice}>
                  {artwork.available ? `$${artwork.price}` : 'Sold'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
