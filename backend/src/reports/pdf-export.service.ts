import { Injectable, Logger } from '@nestjs/common'
import * as puppeteer from 'puppeteer'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PdfExportService {
  private readonly logger = new Logger(PdfExportService.name)
  private browser: puppeteer.Browser | null = null

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize puppeteer browser instance
   */
  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.log('Launching puppeteer browser...')
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      })
    }
    return this.browser
  }

  /**
   * Generate PDF from Monday Ritual report
   */
  async generateMondayRitualPdf(merchantId: string): Promise<Buffer> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      // Get frontend URL from config
      const frontendUrl =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000'

      // Navigate to Monday Ritual page with print-friendly query param
      const url = `${frontendUrl}/dashboard/monday-ritual?merchantId=${merchantId}&print=true`

      this.logger.log(`Generating PDF from: ${url}`)

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      // Wait for content to load
      await page.waitForSelector('.monday-ritual-content', {
        timeout: 10000,
      })

      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      })

      this.logger.log('PDF generated successfully')

      return Buffer.from(pdf)
    } catch (error) {
      this.logger.error(`Failed to generate PDF: ${error.message}`, error.stack)
      throw error
    } finally {
      await page.close()
    }
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePdfFromHtml(html: string, options?: {
    format?: 'A4' | 'Letter'
    landscape?: boolean
  }): Promise<Buffer> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      })

      // Generate PDF
      const pdf = await page.pdf({
        format: options?.format || 'A4',
        landscape: options?.landscape || false,
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      })

      return Buffer.from(pdf)
    } catch (error) {
      this.logger.error(`Failed to generate PDF from HTML: ${error.message}`, error.stack)
      throw error
    } finally {
      await page.close()
    }
  }

  /**
   * Cleanup - close browser
   */
  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.logger.log('Puppeteer browser closed')
    }
  }
}
