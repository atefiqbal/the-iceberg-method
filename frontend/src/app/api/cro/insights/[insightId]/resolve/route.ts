import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { insightId: string } },
) {
  try {
    // Mock merchant ID - in production, get from session
    const merchantId = 'merchant-123'
    const body = await request.json()

    const response = await fetch(
      `http://localhost:3000/cro/${merchantId}/insights/${params.insightId}/resolve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )

    if (!response.ok) {
      throw new Error('Failed to resolve insight')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve insight' },
      { status: 500 },
    )
  }
}
