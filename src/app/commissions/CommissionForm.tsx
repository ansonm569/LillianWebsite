'use client'

import { useState } from 'react'
import styles from './page.module.css'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function CommissionForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLSelectElement).value,
      medium: (form.elements.namedItem('medium') as HTMLSelectElement).value,
      size: (form.elements.namedItem('size') as HTMLInputElement).value,
      timeline: (form.elements.namedItem('timeline') as HTMLSelectElement).value,
      budget: (form.elements.namedItem('budget') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      setStatus('success')
      form.reset()
    } else {
      const json = await res.json().catch(() => ({}))
      setErrorMsg(json.error ?? 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Name</label>
          <input className={styles.input} id="name" name="name" type="text" required autoComplete="name" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email</label>
          <input className={styles.input} id="email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="subject">Type of commission</label>
        <select className={styles.select} id="subject" name="subject">
          <option value="">— select —</option>
          <option value="Portrait">Portrait</option>
          <option value="Figure study">Figure study</option>
          <option value="Interior">Interior</option>
          <option value="Landscape">Landscape</option>
          <option value="Still life">Still life</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="medium">Medium preference</label>
          <select className={styles.select} id="medium" name="medium">
            <option value="">— no preference —</option>
            <option value="Charcoal on paper">Charcoal on paper</option>
            <option value="Graphite on paper">Graphite on paper</option>
            <option value="Ink on paper">Ink on paper</option>
            <option value="Oil on canvas">Oil on canvas</option>
            <option value="Oil on linen">Oil on linen</option>
            <option value="Oil on board">Oil on board</option>
            <option value="Open to suggestion">Open to suggestion</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="size">Approximate size</label>
          <input className={styles.input} id="size" name="size" type="text" placeholder="e.g. 18 × 24 in" />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="timeline">Timeline</label>
          <select className={styles.select} id="timeline" name="timeline">
            <option value="">— flexible —</option>
            <option value="1–2 months">1–2 months</option>
            <option value="3–4 months">3–4 months</option>
            <option value="5–6 months">5–6 months</option>
            <option value="No rush">No rush</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="budget">Budget range</label>
          <select className={styles.select} id="budget" name="budget">
            <option value="">— not sure yet —</option>
            <option value="Under $500">Under $500</option>
            <option value="$500–$1,000">$500–$1,000</option>
            <option value="$1,000–$2,000">$1,000–$2,000</option>
            <option value="$2,000+">$2,000+</option>
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="message">Tell me about your idea</label>
        <textarea
          className={styles.textarea}
          id="message"
          name="message"
          required
          placeholder="Describe the subject, mood, reference images you might have, or anything else that would help me understand what you're envisioning."
        />
      </div>

      <div className={styles.submitRow}>
        <button className={styles.submit} type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Send inquiry'}
        </button>
        {status === 'success' && (
          <span className={`${styles.statusMessage} ${styles.success}`}>
            Message sent — I&rsquo;ll be in touch soon.
          </span>
        )}
        {status === 'error' && (
          <span className={`${styles.statusMessage} ${styles.error}`}>{errorMsg}</span>
        )}
      </div>
    </form>
  )
}
