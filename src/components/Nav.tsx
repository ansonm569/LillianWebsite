import Link from 'next/link'
import styles from './Nav.module.css'

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.brand}>Lillian MacKinney</Link>
      <div className={styles.links}>
        <Link href="/work">Work</Link>
        <Link href="/commissions">Commissions</Link>
        <Link href="/about">About</Link>
      </div>
    </nav>
  )
}
