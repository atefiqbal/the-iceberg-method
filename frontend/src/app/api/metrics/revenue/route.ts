import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

/**
 * Get revenue metrics from OLAP database
 * GET /api/metrics/revenue?startDate=2024-01-01&endDate=2024-01-31&merchantId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const merchantId = searchParams.get('merchantId')

    if (!startDate || !endDate || !merchantId) {
      return NextResponse.json(
        { error: 'startDate, endDate, and merchantId are required' },
        { status: 400 },
      )
    }

    // TODO: Get token from session/cookie
    const token = request.headers.get('authorization')

    const response = await fetch(
      `${BACKEND_URL}/metrics/revenue?startDate=${startDate}&endDate=${endDate}&merchantId=${merchantId}`,
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
    console.error('Failed to fetch revenue metrics:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
