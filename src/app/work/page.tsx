import { catalog } from '@/data/catalog'
import WorksFilter from '@/components/WorksFilter'
import styles from './page.module.css'

export const metadata = { title: 'Work — Lillian MacKinney' }

export default function WorkPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Work</h1>
      </div>
      <WorksFilter artworks={catalog} />
    </div>
  )
}
