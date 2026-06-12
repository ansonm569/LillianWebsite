import Image from 'next/image'
import styles from './page.module.css'

export const metadata = { title: 'About — Lillian MacKinney' }

export default function AboutPage() {
  return (
    <div className={styles.page}>

      {/* Top: bio left, portrait right */}
      <div className={styles.layout}>
        <div className={styles.textCol}>
          <div className={styles.nameBlock}>
            <h1 className={styles.name}>Lillian MacKinney</h1>
            <p className={styles.location}>Milwaukee, WI</p>
          </div>
          <div className={styles.bio}>
            <p>
              Lillian MacKinney is a painter and draughtsman whose practice is rooted in
              close observation — of the human figure, the still life, and the spaces
              between objects. She holds a degree in Studio Art from Wake Forest University,
              where her work was shaped by sustained study in drawing, painting, and printmaking.
            </p>
            <p>
              Her upbringing in rural Colorado in an animal-filled household fostered both
              a deep attention to the natural world and an instinct for patient looking —
              qualities that carry directly into her studio practice. She refined her
              technical foundation through the International Baccalaureate Programme&apos;s
              Higher Level Studio Art coursework before continuing at university.
            </p>
            <p>
              MacKinney works primarily in charcoal, Indian ink, and oil, often in series
              that orbit a single subject over an extended period. She is drawn to the
              moment when a form becomes simultaneously familiar and strange — when light
              renders an object ambiguous, or when a figure&apos;s weight becomes more felt
              than seen.
            </p>
            <p>
              Her work has appeared in <em>Kaleidoscope</em>, a nationally recognized art
              journal, and she received a Scholastic Silver Key Award for her drawing work.
              A piece from her recent series was featured in the Saiga Conservation
              Alliance&apos;s online gallery.
            </p>
            <p>
              She currently lives and works in Milwaukee, WI. Outside the studio, she
              spends time hiking and fostering animals.
            </p>
          </div>
        </div>

        <div className={styles.photoCol}>
          <div className={styles.photoWrapper}>
            <Image
              src="/images/about-portrait.jpg"
              alt="Lillian MacKinney"
              width={1800}
              height={1800}
              style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
            />
          </div>
          <p className={styles.photoCaption}>In the studio, Milwaukee, 2024</p>
        </div>
      </div>

      {/* Exhibitions */}
      <div className={styles.divider} />

      <div className={styles.exhibitions}>
        <h2 className={styles.sectionTitle}>Exhibitions</h2>
        <ul className={styles.exhibitionList}>
          <li className={styles.exhibitionItem}>
            <span className={styles.exhibitionTitle}><em>A Kind Death</em></span>
            <span className={styles.exhibitionMeta}>Start Gallery, Wake Forest University — 2025</span>
          </li>
          <li className={styles.exhibitionItem}>
            <span className={styles.exhibitionTitle}>Student Art Exhibition</span>
            <span className={styles.exhibitionMeta}>Wake Forest University — 2023</span>
          </li>
          <li className={styles.exhibitionItem}>
            <span className={styles.exhibitionTitle}><em>Let It Show</em></span>
            <span className={styles.exhibitionMeta}>2024 &nbsp;·&nbsp; 2023 &nbsp;·&nbsp; 2022</span>
          </li>
          <li className={styles.exhibitionItem}>
            <span className={styles.exhibitionTitle}>Saiga Conservation Alliance Online Gallery</span>
            <span className={styles.exhibitionMeta}>Featured work — ongoing</span>
          </li>
        </ul>
      </div>

      {/* Awards */}
      <div className={styles.divider} />

      <div className={styles.awards}>
        <h2 className={styles.sectionTitle}>Recognition</h2>
        <ul className={styles.awardList}>
          <li>Scholastic Silver Key Award</li>
          <li>Publication in <em>Kaleidoscope</em> (national art journal)</li>
          <li>B.A. Studio Art, Wake Forest University</li>
        </ul>
      </div>

      <div className={styles.divider} />

      {/* Contact */}
      <div className={styles.contactBlock}>
        <span className={styles.contactLabel}>Contact</span>
        <a href="mailto:contact@lillianmackinney.com">contact@lillianmackinney.com</a>
      </div>

    </div>
  )
}
