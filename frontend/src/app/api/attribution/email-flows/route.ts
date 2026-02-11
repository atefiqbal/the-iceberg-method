import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

/**
 * Get email flow attribution
 * GET /api/attribution/email-flows?startDate=2024-01-01&endDate=2024-01-31
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 },
      )
    }

    const token = request.headers.get('authorization')

    const response = await fetch(
      `${BACKEND_URL}/attribution/email-flows?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: token || '',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to fetch email flow attribution:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
