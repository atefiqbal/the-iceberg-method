import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock merchant ID - in production, get from session
    const merchantId = 'merchant-123'

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const pageType = searchParams.get('pageType')
    const severity = searchParams.get('severity')

    let url = `http://localhost:3000/cro/${merchantId}/insights?`
    if (pageType) url += `pageType=${pageType}&`
    if (severity) url += `severity=${severity}&`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch insights')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 },
    )
  }
}
