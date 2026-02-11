import { NextRequest, NextResponse } from 'next/server'

/**
 * Initiates Shopify OAuth flow
 * POST /api/auth/shopify/install
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shop } = body

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop domain is required' },
        { status: 400 }
      )
    }

    // Normalize shop domain
    const shopDomain = shop.includes('.myshopify.com')
      ? shop
      : `${shop}.myshopify.com`

    // Validate shop domain format
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shopDomain)) {
      return NextResponse.json(
        { error: 'Invalid shop domain format' },
        { status: 400 }
      )
    }

    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID
    const scopes = process.env.SHOPIFY_SCOPES || 'read_orders,read_customers,read_products'
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/shopify`

    if (!clientId) {
      return NextResponse.json(
        { error: 'Shopify OAuth not configured' },
        { status: 500 }
      )
    }

    // Generate random state for CSRF protection
    const state = generateRandomState()

    // Store state in session/cookie (in production, use proper session management)
    // For now, we'll pass it through the OAuth flow

    // Construct Shopify OAuth URL
    const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`

    return NextResponse.json({
      authUrl,
      shop: shopDomain,
      state,
    })
  } catch (error) {
    console.error('Shopify OAuth init error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

function generateRandomState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
