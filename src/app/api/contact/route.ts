import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { clientIp, rateLimit } from '@/lib/rate-limit'

// Until the domain is verified in Resend, the sandbox sender only delivers
// to the Resend account owner's address. Set EMAIL_FROM once verified.
const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

export async function POST(req: NextRequest) {
  if (!rateLimit(`contact:${clientIp(req.headers)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many messages — please try again later.' }, { status: 429 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set')
    return NextResponse.json({ error: 'The contact form is not available right now. Please email directly.' }, { status: 500 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, subject, medium, size, timeline, budget, message, website } = body

  // Honeypot: the hidden "website" field is invisible to people; only bots
  // fill it. Pretend success so they don't adapt.
  if (website) {
    return NextResponse.json({ ok: true })
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
  }

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    subject ? `Subject: ${subject}` : null,
    medium ? `Medium preference: ${medium}` : null,
    size ? `Approximate size: ${size}` : null,
    timeline ? `Timeline: ${timeline}` : null,
    budget ? `Budget: ${budget}` : null,
    `\nMessage:\n${message}`,
  ].filter(Boolean)

  try {
    const resend = new Resend(apiKey)
    // Resend reports API failures via the `error` field rather than throwing.
    const { error } = await resend.emails.send({
      from: `Commissions <${FROM_ADDRESS}>`,
      to: 'contact@lillianmackinney.com',
      replyTo: email,
      subject: `Commission inquiry from ${name}`,
      text: lines.join('\n'),
    })
    if (error) {
      console.error('Contact email failed:', error)
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact email failed:', err)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
