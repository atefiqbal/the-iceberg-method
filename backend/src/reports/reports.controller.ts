import { Controller, Get, UseGuards, Request, Res } from '@nestjs/common'
import { Response } from 'express'
import { ReportsService } from './reports.service'
import { PdfExportService } from './pdf-export.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AuthenticatedRequest } from '../common/types/express-request.interface'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfExportService: PdfExportService,
  ) {}

  /**
   * Get current week's Monday Ritual report
   */
  @Get('weekly')
  async getWeeklyReport(@Request() req: AuthenticatedRequest) {
    const report = await this.reportsService.generateWeeklyReport(
      req.user.merchantId,
    )
    return {
      success: true,
      report,
    }
  }

  /**
   * Export Monday Ritual report as PDF
   */
  @Get('weekly/pdf')
  async exportWeeklyPdf(@Request() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      const pdf = await this.pdfExportService.generateMondayRitualPdf(
        req.user.merchantId,
      )
      // Set headers for PDF download
      const filename = `monday-ritual-${new Date().toISOString().split('T')[0]}.pdf`
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Content-Length', pdf.length)
      // Send PDF buffer
      res.send(pdf)
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate PDF',
        message: error.message,
      })
    }
  }
}
