import styles from './page.module.css'

export const metadata = { title: 'About — Lillian MacKinney' }

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.name}>Lillian MacKinney</h1>
        <div className={styles.bio}>
          <p>
            Lillian MacKinney is an artist working in charcoal, Indian ink, and oil.
            Her practice explores form, light, and the quiet geometry of the observed world.
          </p>
          <p>
            Based in [City].
          </p>
        </div>
        <p className={styles.contact}>
          <a href="mailto:contact@lillianmackinney.com">contact@lillianmackinney.com</a>
        </p>
      </div>
    </div>
  )
}
