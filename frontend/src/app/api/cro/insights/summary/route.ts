import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock merchant ID - in production, get from session
    const merchantId = 'merchant-123'

    const response = await fetch(
      `http://localhost:3000/cro/${merchantId}/insights/summary`,
    )

    if (!response.ok) {
      throw new Error('Failed to fetch insights summary')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights summary' },
      { status: 500 },
    )
  }
}
