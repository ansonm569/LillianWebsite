import styles from './page.module.css'

export const metadata = { title: 'About — Lillian MacKinney' }

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.nameBlock}>
          <h1 className={styles.name}>Lillian MacKinney</h1>
          <p className={styles.location}>Milwaukee, WI</p>
        </div>
        <div className={styles.bio}>
          <p>
            Lillian MacKinney is an artist working in charcoal, Indian ink, and oil.
            Her practice explores form, light, and the quiet geometry of the observed world.
          </p>
          <p>
            Each piece is made by hand and exists as a singular object.
          </p>
        </div>
        <div className={styles.divider} />
        <div className={styles.contactBlock}>
          <span className={styles.contactLabel}>Contact</span>
          <a href="mailto:contact@lillianmackinney.com">contact@lillianmackinney.com</a>
        </div>
      </div>
    </div>
  )
}
