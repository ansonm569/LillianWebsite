import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, subject, medium, size, timeline, budget, message } = body

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
    await resend.emails.send({
      from: 'Commissions <onboarding@resend.dev>',
      to: 'contact@lillianmackinney.com',
      replyTo: email,
      subject: `Commission inquiry from ${name}`,
      text: lines.join('\n'),
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
