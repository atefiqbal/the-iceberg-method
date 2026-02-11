import { DataSource } from 'typeorm'
import * as jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') })

/**
 * Seed script to create test merchant and initialize phases
 * Run with: npx ts-node scripts/seed-test-data.ts
 */

async function seedTestData() {
  // Create connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'iceberg_prod',
  })

  try {
    await dataSource.initialize()
    console.log('✅ Database connected')

    // Check if test merchant exists
    const existingMerchant = await dataSource.query(
      `SELECT id FROM merchants WHERE "shopifyDomain" = $1`,
      ['test-store.myshopify.com'],
    )

    let merchantId: string

    if (existingMerchant.length > 0) {
      merchantId = existingMerchant[0].id
      console.log(`✅ Test merchant already exists: ${merchantId}`)
    } else {
      // Create test merchant
      const result = await dataSource.query(
        `INSERT INTO merchants ("shopifyDomain", email, "businessName", timezone, status, settings, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id`,
        [
          'test-store.myshopify.com',
          'test@example.com',
          'Test Store',
          'America/New_York',
          'active',
          JSON.stringify({}),
        ],
      )
      merchantId = result[0].id
      console.log(`✅ Test merchant created: ${merchantId}`)
    }

    // Check if phases are initialized
    const existingPhases = await dataSource.query(
      `SELECT COUNT(*) as count FROM phase_completions WHERE "merchantId" = $1`,
      [merchantId],
    )

    if (parseInt(existingPhases[0].count) > 0) {
      console.log('✅ Phases already initialized for test merchant')
    } else {
      // Initialize Phase 1 as current
      await dataSource.query(
        `INSERT INTO phase_completions ("merchantId", phase, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [merchantId, 'deliverability', 'current'],
      )
      console.log('✅ Phases initialized (Phase 1: Deliverability is current)')
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'test-secret-key-change-in-production'
    const token = jwt.sign(
      {
        merchantId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      },
      jwtSecret,
    )

    console.log('\n📋 Test Data Created Successfully!\n')
    console.log('Merchant ID:', merchantId)
    console.log('Email:', 'test@example.com')
    console.log('Shopify Domain:', 'test-store.myshopify.com')
    console.log('\n🔑 JWT Token (valid for 30 days):')
    console.log(token)
    console.log('\n📝 Test API with curl:')
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/phases`)
    console.log('\n💡 Add to localStorage in browser console:')
    console.log(`localStorage.setItem('auth_token', '${token}')`)

    await dataSource.destroy()
    console.log('\n✅ Database connection closed')
  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    throw error
  }
}

seedTestData()
  .then(() => {
    console.log('\n✅ Seed completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  })
