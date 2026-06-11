import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <a href="mailto:contact@lillianmackinney.com">
        contact@lillianmackinney.com
      </a>
      <span className={styles.copy}>
        © {new Date().getFullYear()} Lillian MacKinney
      </span>
    </footer>
  )
}
