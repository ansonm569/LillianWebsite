import styles from './page.module.css'
import CommissionForm from './CommissionForm'

export const metadata = { title: 'Commissions — Lillian MacKinney' }

export default function CommissionsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.heading}>Commissions</h1>
        <p className={styles.lead}>
          I work with collectors, families, and individuals on original commissioned pieces across my usual
          mediums — charcoal, graphite, ink, and oil. A commission is a conversation: it starts with your
          idea and ends with something made specifically for you, in the same considered way I approach all
          my work.
        </p>
        <p className={styles.lead}>
          I&rsquo;m open to a range of subjects: portraits from life or reference, figure studies, interiors,
          landscapes, and still lifes. If you&rsquo;re unsure whether what you have in mind fits, reach out
          anyway — I&rsquo;d rather hear the idea than not.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>How it works</h2>
        <ol className={styles.processList}>
          <li>Send me a note below with as much or as little detail as you have. I read every message and reply within a few days.</li>
          <li>We talk through the subject, scale, medium, and timeline. I&rsquo;ll share examples of comparable work and give you a quote.</li>
          <li>A 50% deposit secures your spot. I work through a limited number of commissions at a time, so availability varies.</li>
          <li>I share progress photos as the work develops. You have one round of adjustments before the piece is finished.</li>
          <li>The balance is due on completion. The piece ships once payment clears.</li>
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Shipping &amp; delivery</h2>
        <p className={styles.body}>
          Works on paper are carefully rolled and shipped in rigid archival tubes, padded at both ends, via
          insured courier. Canvases and boards travel flat in custom-built crates or reinforced flat packs,
          depending on size. I use carriers with art-handling options and provide a tracking number as soon as
          the piece ships.
        </p>
        <p className={styles.body}>
          Domestic delivery (US) typically takes 3–7 business days. International shipping is available —
          please note that import duties and taxes are the responsibility of the buyer. I&rsquo;ll give you a
          shipping estimate as part of the quote.
        </p>
        <div className={styles.shippingNote}>
          <strong>Note on paper works:</strong> All drawings and works on paper are shipped rolled in
          archival-quality tubes and should be unrolled and allowed to relax flat before framing. I recommend
          framing behind UV-protective glass and can suggest framing approaches on request.
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Get in touch</h2>
        <p className={styles.body}>
          Use the form below or email me directly at{' '}
          <a href="mailto:contact@lillianmackinney.com">contact@lillianmackinney.com</a>.
          The more context you can share about what you have in mind, the better — reference images,
          rough dimensions, and any particular mood or intent are all helpful.
        </p>
        <CommissionForm />
      </section>
    </div>
  )
}
