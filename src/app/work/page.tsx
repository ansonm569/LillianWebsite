import { catalog } from '@/data/catalog'
import MasonryGrid from '@/components/MasonryGrid'
import styles from './page.module.css'

export const metadata = { title: 'Work — Lillian MacKinney' }

export default function WorkPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Work</h1>
        <span className={styles.count}>{catalog.length} pieces</span>
      </div>
      <MasonryGrid artworks={catalog} />
    </div>
  )
}
