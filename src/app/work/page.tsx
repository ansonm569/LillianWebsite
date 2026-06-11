import { catalog } from '@/data/catalog'
import MasonryGrid from '@/components/MasonryGrid'
import styles from './page.module.css'

export const metadata = { title: 'Work — Lillian MacKinney' }

export default function WorkPage() {
  return (
    <div className={styles.page}>
      <MasonryGrid artworks={catalog} />
    </div>
  )
}
