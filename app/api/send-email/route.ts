import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  const smtp_user = process.env.NEXT_PUBLIC_SMTP_USER
  const smtp_pass = process.env.NEXT_PUBLIC_SMTP_PASS

  if (!smtp_user || !smtp_pass) {
    console.error('Missing email configuration:', { smtp_user, smtp_pass })
    return NextResponse.json(
      { error: 'Email service not configured properly' },
      { status: 500 }
    )
  }

  try {
    const { to, subject, content } = await request.json()

    // Create transporter with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtp_user,
        pass: smtp_pass
      }
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"Shan Association" <${smtp_user}>`,
      to,
      subject,
      text: content,
      html: content.replace(/\n/g, '<br>')
    })

    console.log('Message sent:', info.messageId)
    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
} 