import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json()
    
    // Format phone number to E.164 format
    const formatPhoneNumber = (phone: string) => {
      // Remove all non-digits
      const digits = phone.replace(/\D/g, '')
      // Add + and 91 prefix if not present
      return digits.startsWith('91') ? `+${digits}` : `+91${digits}`
    }

    // Updated SMS-Gate.app credentials
    const username = 'RZWP7S'
    const password = 'ogghbjlronnlma'
    const baseUrl = 'https://api.sms-gate.app'

    // Create basic auth header
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

    const response = await fetch(`${baseUrl}/3rdparty/v1/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        message: message,
        phoneNumbers: [formatPhoneNumber(to)]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SMS Gateway error: ${error}`)
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('SMS Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    )
  }
} 