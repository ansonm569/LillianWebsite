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
          <p className={styles.tagline}>Original works on paper and canvas.</p>
          <Link href="/work" className={styles.cta}>View all work →</Link>
        </div>
      </div>
    </div>
  )
}
