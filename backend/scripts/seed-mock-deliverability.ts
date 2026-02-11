import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as crypto from 'crypto'

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') })

/**
 * Seed mock deliverability data for testing Phase 1 UI
 * Run with: npx ts-node scripts/seed-mock-deliverability.ts
 */

const MERCHANT_ID = '4953b70e-e2f6-4399-8d28-e0f334d42d91'

// Encryption helper (matches backend AES-256-GCM)
function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  const key = Buffer.from(encryptionKey, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

async function seedMockDeliverability() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'atifmac',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'iceberg_prod',
  })

  try {
    await dataSource.initialize()
    console.log('✅ Database connected')

    // Clean up existing data
    console.log('\n🧹 Cleaning up existing data...')
    await dataSource.query(
      `DELETE FROM gate_states WHERE "merchantId" = $1`,
      [MERCHANT_ID]
    )
    await dataSource.query(
      `DELETE FROM merchant_integrations WHERE "merchantId" = $1 AND provider = 'klaviyo'`,
      [MERCHANT_ID]
    )

    // Create mock Klaviyo integration
    console.log('\n📧 Creating mock Klaviyo integration...')
    const mockApiKey = 'pk_test_mock_klaviyo_key_for_testing'
    const { encrypted, iv, authTag } = encrypt(mockApiKey)

    await dataSource.query(
      `INSERT INTO merchant_integrations
       ("merchantId", provider, "encryptedToken", iv, "authTag", status, config, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        MERCHANT_ID,
        'klaviyo',
        encrypted,
        iv,
        authTag,
        'active',
        JSON.stringify({
          connectedAt: new Date().toISOString(),
          accountId: 'mock_account_123',
        })
      ]
    )
    console.log('✅ Klaviyo integration created')

    // Scenario selector
    console.log('\n🎭 Select a gate scenario to simulate:\n')
    console.log('1. PASS - All metrics healthy (hard bounce 0.3%, soft bounce 1.2%, spam 0.05%)')
    console.log('2. WARNING - Soft bounce approaching threshold (hard 0.4%, soft 4.5%, spam 0.08%)')
    console.log('3. GRACE PERIOD - Hard bounce exceeded, 12 hours remaining (hard 0.7%, soft 2.1%, spam 0.06%)')
    console.log('4. FAIL - Multiple thresholds exceeded (hard 0.9%, soft 6.2%, spam 0.15%)')

    const scenario = process.argv[2] || '1'

    let gateStatus: string
    let hardBounceRate: number
    let softBounceRate: number
    let spamComplaintRate: number
    let message: string
    let gracePeriodEndsAt: Date | null = null
    let blockedFeatures: string[] = []

    switch(scenario) {
      case '1': // PASS
        gateStatus = 'pass'
        hardBounceRate = 0.003  // 0.3%
        softBounceRate = 0.012  // 1.2%
        spamComplaintRate = 0.0005  // 0.05%
        message = 'Deliverability healthy. All thresholds within limits.'
        console.log('\n✅ Simulating: PASS scenario')
        break

      case '2': // WARNING
        gateStatus = 'warning'
        hardBounceRate = 0.004  // 0.4%
        softBounceRate = 0.045  // 4.5%
        spamComplaintRate = 0.0008  // 0.08%
        message = 'WARNING: Soft bounce rate at 4.5% (threshold: 3% warning, 5% fail). Monitor closely.'
        console.log('\n⚠️  Simulating: WARNING scenario')
        break

      case '3': // GRACE PERIOD
        gateStatus = 'grace_period'
        hardBounceRate = 0.007  // 0.7%
        softBounceRate = 0.021  // 2.1%
        spamComplaintRate = 0.0006  // 0.06%
        gracePeriodEndsAt = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
        message = `Deliverability gate: FAIL. Hard bounce 0.7% (threshold: 0.5%). Grace period expires in 12 hours. Fix deliverability or campaigns auto-pause.`
        blockedFeatures = ['promotions', 'broadcasts']
        console.log('\n⏳ Simulating: GRACE PERIOD scenario (12 hours remaining)')
        break

      case '4': // FAIL
        gateStatus = 'fail'
        hardBounceRate = 0.009  // 0.9%
        softBounceRate = 0.062  // 6.2%
        spamComplaintRate = 0.0015  // 0.15%
        message = 'Deliverability gate: FAIL. Hard bounce 0.9% (threshold: 0.5%), soft bounce 6.2% (threshold: 5.0%), spam complaint 0.15% (threshold: 0.1%). Promotions blocked.'
        blockedFeatures = ['promotions', 'broadcasts']
        console.log('\n❌ Simulating: FAIL scenario')
        break

      default:
        throw new Error('Invalid scenario. Use 1, 2, 3, or 4')
    }

    // Create gate state
    console.log('\n📊 Creating gate state...')
    await dataSource.query(
      `INSERT INTO gate_states
       ("merchantId", "gateType", status, metrics, message, "blockedFeatures", "gracePeriodEndsAt", "lastEvaluatedAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        MERCHANT_ID,
        'deliverability',
        gateStatus,
        JSON.stringify({
          hardBounceRate,
          softBounceRate,
          spamComplaintRate,
          emailsSent: 125000,
          hardBounces: Math.round(125000 * hardBounceRate),
          softBounces: Math.round(125000 * softBounceRate),
          spamComplaints: Math.round(125000 * spamComplaintRate),
          lastUpdated: new Date().toISOString(),
        }),
        message,
        JSON.stringify(blockedFeatures),
        gracePeriodEndsAt,
      ]
    )
    console.log('✅ Gate state created')

    // Create some historical orders for baseline calculation context
    console.log('\n📦 Creating mock order data (for baseline context)...')
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
      const revenue = 5000 + Math.random() * 3000 // $5k-$8k per day

      // Create a few orders for this day
      for (let j = 0; j < 5; j++) {
        const shopifyOrderId = 1000000 + (i * 5) + j
        const orderRevenue = revenue / 5

        await dataSource.query(
          `INSERT INTO orders
           ("merchantId", "shopifyOrderId", revenue, "createdAt")
           VALUES ($1, $2, $3, $4)
           ON CONFLICT ("merchantId", "shopifyOrderId") DO NOTHING`,
          [
            MERCHANT_ID,
            shopifyOrderId,
            orderRevenue,
            date,
          ]
        )
      }
    }
    console.log('✅ Created 30 days of mock order data (150 orders)')

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 Mock Deliverability Data Seeded Successfully!')
    console.log('='.repeat(60))
    console.log('\n📋 Summary:')
    console.log(`   Merchant ID: ${MERCHANT_ID}`)
    console.log(`   Gate Status: ${gateStatus.toUpperCase()}`)
    console.log(`   Hard Bounce Rate: ${(hardBounceRate * 100).toFixed(2)}%`)
    console.log(`   Soft Bounce Rate: ${(softBounceRate * 100).toFixed(2)}%`)
    console.log(`   Spam Complaint Rate: ${(spamComplaintRate * 100).toFixed(2)}%`)
    if (gracePeriodEndsAt) {
      console.log(`   Grace Period Ends: ${gracePeriodEndsAt.toLocaleString()}`)
    }
    console.log(`   Blocked Features: ${blockedFeatures.length > 0 ? blockedFeatures.join(', ') : 'None'}`)

    console.log('\n🌐 Next Steps:')
    console.log('   1. Open: http://localhost:3000/dashboard/deliverability')
    console.log('   2. Set auth cookie in browser console:')
    console.log('      document.cookie = "auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZXJjaGFudElkIjoiNDk1M2I3MGUtZTJmNi00Mzk5LThkMjgtZTBmMzM0ZDQyZDkxIiwiaWF0IjoxNzcwODA3ODE0LCJleHAiOjE3NzMzOTk4MTR9.cq-dJ35TVwG81kjvOl_Hld2AzEIbLWm7duHXoqoriLA; path=/; max-age=2592000";')
    console.log('   3. Reload page to see the deliverability dashboard with mock data')
    console.log('\n💡 To test other scenarios, run:')
    console.log('   npx ts-node scripts/seed-mock-deliverability.ts 1  # PASS')
    console.log('   npx ts-node scripts/seed-mock-deliverability.ts 2  # WARNING')
    console.log('   npx ts-node scripts/seed-mock-deliverability.ts 3  # GRACE PERIOD')
    console.log('   npx ts-node scripts/seed-mock-deliverability.ts 4  # FAIL')

    await dataSource.destroy()
  } catch (error) {
    console.error('❌ Error seeding mock data:', error)
    throw error
  }
}

seedMockDeliverability()
  .then(() => {
    console.log('\n✅ Seed completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  })
