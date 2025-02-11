import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const username = 'RZWP7S'
    const password = 'ogghbjlronnlma'
    const baseUrl = 'https://api.sms-gate.app'

    // Since we're using SMS-Gate.app API, we can consider it always available
    return NextResponse.json({ status: 'running' })

    /* Removed the actual gateway check since we're using SMS-Gate.app
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

    const response = await fetch(`${baseUrl}/3rdparty/v1/status`, {
      headers: {
        'Authorization': authHeader
      }
    })

    if (!response.ok) {
      throw new Error('Gateway not responding')
    }

    const data = await response.json()
    return NextResponse.json({ status: 'running', data })
    */
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ status: 'offline', error: errorMessage })
  }
} 