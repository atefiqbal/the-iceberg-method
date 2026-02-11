import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WebhookDLQ, DLQStatus } from './entities/webhook-dlq.entity'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'

@Injectable()
export class DLQService {
  private readonly logger = new Logger(DLQService.name)

  constructor(
    @InjectRepository(WebhookDLQ)
    private readonly dlqRepository: Repository<WebhookDLQ>,
    @InjectQueue('webhooks')
    private webhooksQueue: Queue,
  ) {}

  /**
   * Add a failed webhook to the DLQ
   */
  async addToDLQ(
    merchantId: string,
    webhookId: string,
    topic: string,
    shopDomain: string,
    payload: any,
    error: Error,
  ): Promise<WebhookDLQ> {
    this.logger.warn(
      `Adding webhook ${webhookId} to DLQ for merchant ${merchantId}: ${error.message}`,
    )

    const dlqEntry = this.dlqRepository.create({
      merchantId,
      webhookId,
      topic,
      shopDomain,
      payload,
      errorMessage: error.message,
      errorStack: error.stack,
      status: DLQStatus.FAILED,
      retryCount: 0,
    })

    return await this.dlqRepository.save(dlqEntry)
  }

  /**
   * Get all failed webhooks for a merchant
   */
  async getFailedWebhooks(
    merchantId: string,
    options?: {
      status?: DLQStatus
      limit?: number
      offset?: number
    },
  ): Promise<{ items: WebhookDLQ[]; total: number }> {
    const query = this.dlqRepository.createQueryBuilder('dlq').where('dlq.merchantId = :merchantId', { merchantId })

    if (options?.status) {
      query.andWhere('dlq.status = :status', { status: options.status })
    }

    const total = await query.getCount()

    if (options?.limit) {
      query.limit(options.limit)
    }

    if (options?.offset) {
      query.offset(options.offset)
    }

    query.orderBy('dlq.createdAt', 'DESC')

    const items = await query.getMany()

    return { items, total }
  }

  /**
   * Retry a failed webhook
   */
  async retryWebhook(dlqId: string): Promise<void> {
    const dlqEntry = await this.dlqRepository.findOne({ where: { id: dlqId } })

    if (!dlqEntry) {
      throw new Error(`DLQ entry ${dlqId} not found`)
    }

    if (dlqEntry.status === DLQStatus.RESOLVED) {
      throw new Error('Cannot retry a resolved webhook')
    }

    this.logger.log(
      `Retrying webhook ${dlqEntry.webhookId} from DLQ (retry #${dlqEntry.retryCount + 1})`,
    )

    // Update status
    dlqEntry.status = DLQStatus.RETRYING
    dlqEntry.retryCount++
    dlqEntry.lastRetryAt = new Date()
    await this.dlqRepository.save(dlqEntry)

    // Re-queue webhook for processing
    await this.webhooksQueue.add(
      'process-shopify',
      {
        topic: dlqEntry.topic,
        shopDomain: dlqEntry.shopDomain,
        webhookId: dlqEntry.webhookId,
        payload: dlqEntry.payload,
        receivedAt: dlqEntry.createdAt,
        isRetry: true,
        dlqId: dlqEntry.id,
      },
      {
        attempts: 1, // Only one attempt for manual retries
        removeOnComplete: false,
      },
    )
  }

  /**
   * Mark a webhook as resolved
   */
  async markResolved(
    dlqId: string,
    resolvedBy: string,
    notes?: string,
  ): Promise<void> {
    const dlqEntry = await this.dlqRepository.findOne({ where: { id: dlqId } })

    if (!dlqEntry) {
      throw new Error(`DLQ entry ${dlqId} not found`)
    }

    this.logger.log(`Marking webhook ${dlqEntry.webhookId} as resolved by ${resolvedBy}`)

    dlqEntry.status = DLQStatus.RESOLVED
    dlqEntry.resolvedBy = resolvedBy
    dlqEntry.resolutionNotes = notes || null

    await this.dlqRepository.save(dlqEntry)
  }

  /**
   * Mark a webhook as ignored (won't be retried)
   */
  async markIgnored(
    dlqId: string,
    resolvedBy: string,
    reason?: string,
  ): Promise<void> {
    const dlqEntry = await this.dlqRepository.findOne({ where: { id: dlqId } })

    if (!dlqEntry) {
      throw new Error(`DLQ entry ${dlqId} not found`)
    }

    this.logger.log(`Marking webhook ${dlqEntry.webhookId} as ignored by ${resolvedBy}`)

    dlqEntry.status = DLQStatus.IGNORED
    dlqEntry.resolvedBy = resolvedBy
    dlqEntry.resolutionNotes = reason || 'Manually ignored'

    await this.dlqRepository.save(dlqEntry)
  }

  /**
   * Get DLQ stats for a merchant
   */
  async getStats(merchantId: string): Promise<{
    total: number
    failed: number
    retrying: number
    resolved: number
    ignored: number
  }> {
    const [total, failed, retrying, resolved, ignored] = await Promise.all([
      this.dlqRepository.count({ where: { merchantId } }),
      this.dlqRepository.count({ where: { merchantId, status: DLQStatus.FAILED } }),
      this.dlqRepository.count({ where: { merchantId, status: DLQStatus.RETRYING } }),
      this.dlqRepository.count({ where: { merchantId, status: DLQStatus.RESOLVED } }),
      this.dlqRepository.count({ where: { merchantId, status: DLQStatus.IGNORED } }),
    ])

    return {
      total,
      failed,
      retrying,
      resolved,
      ignored,
    }
  }

  /**
   * Update DLQ entry after retry attempt
   */
  async updateAfterRetry(dlqId: string, success: boolean, error?: Error): Promise<void> {
    const dlqEntry = await this.dlqRepository.findOne({ where: { id: dlqId } })

    if (!dlqEntry) {
      this.logger.warn(`DLQ entry ${dlqId} not found for retry update`)
      return
    }

    if (success) {
      dlqEntry.status = DLQStatus.RESOLVED
      dlqEntry.resolutionNotes = `Automatically resolved on retry #${dlqEntry.retryCount}`
      this.logger.log(
        `Webhook ${dlqEntry.webhookId} successfully processed after retry`,
      )
    } else {
      dlqEntry.status = DLQStatus.FAILED
      if (error) {
        dlqEntry.errorMessage = error.message
        dlqEntry.errorStack = error.stack || null
      }
      this.logger.warn(
        `Webhook ${dlqEntry.webhookId} failed again on retry #${dlqEntry.retryCount}`,
      )
    }

    await this.dlqRepository.save(dlqEntry)
  }

  /**
   * Get DLQ entries for a merchant (stub - to be implemented)
   */
  async getEntries(merchantId: string, status?: string, limit: number = 50): Promise<any[]> {
    this.logger.log(`Getting DLQ entries for merchant ${merchantId}`)
    const where: any = { merchantId }
    if (status) {
      where.status = status
    }

    return await this.dlqRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }
}
