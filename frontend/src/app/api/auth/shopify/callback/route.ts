import { NextRequest, NextResponse } from 'next/server'

/**
 * Handles Shopify OAuth callback
 * POST /api/auth/shopify/callback
 *
 * In production, this would:
 * 1. Exchange authorization code for access token
 * 2. Store encrypted token in database
 * 3. Create merchant account
 * 4. Initiate backfill job
 * 5. Create session and return JWT
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, shop } = body

    if (!code || !shop) {
      return NextResponse.json(
        { error: 'Missing code or shop parameter' },
        { status: 400 }
      )
    }

    // TODO: Verify state parameter for CSRF protection

    // Exchange authorization code for access token
    const accessToken = await exchangeCodeForToken(code, shop)

    // TODO: Store encrypted access token in database
    // const merchant = await createOrUpdateMerchant(shop, accessToken)

    // TODO: Queue backfill job to pull 90 days of historical data
    // await queueBackfillJob(merchant.id)

    // TODO: Create session and generate JWT
    // const sessionToken = generateJWT(merchant.id)

    // For now, return success with mock data
    return NextResponse.json({
      success: true,
      merchant: {
        id: 'mock-merchant-id',
        shopDomain: shop,
        status: 'active',
      },
      // In production, set this as an httpOnly cookie
      token: 'mock-session-token',
    })
  } catch (error) {
    console.error('Shopify OAuth callback error:', error)
    return NextResponse.json(
      { error: 'Failed to complete OAuth flow' },
      { status: 500 }
    )
  }
}

async function exchangeCodeForToken(code: string, shop: string): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Shopify OAuth credentials not configured')
  }

  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })

    if (!response.ok) {
      throw new Error(`Shopify token exchange failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Token exchange error:', error)
    throw new Error('Failed to exchange authorization code for access token')
  }
}

// TODO: Implement in backend service
// async function createOrUpdateMerchant(shop: string, accessToken: string) {
//   // Store in database with encrypted token
// }

// TODO: Implement in backend service
// async function queueBackfillJob(merchantId: string) {
//   // Queue job to pull 90 days of historical orders
// }

// TODO: Implement JWT generation
// function generateJWT(merchantId: string): string {
//   // Generate JWT with merchant ID and expiration
// }
