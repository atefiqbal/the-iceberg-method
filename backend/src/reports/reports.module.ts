import { Module } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { PdfExportService } from './pdf-export.service'
import { ReportsController } from './reports.controller'
import { MetricsModule } from '../metrics/metrics.module'
import { GatesModule } from '../gates/gates.module'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [MetricsModule, GatesModule, OrdersModule],
  controllers: [ReportsController],
  providers: [ReportsService, PdfExportService],
  exports: [ReportsService, PdfExportService],
})
export class ReportsModule {}
