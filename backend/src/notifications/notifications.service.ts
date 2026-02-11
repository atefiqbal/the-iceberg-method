import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import {
  Notification,
  NotificationType,
  NotificationSeverity,
} from './entities/notification.entity'

export interface CreateNotificationDto {
  merchantId: string
  type: NotificationType
  severity: NotificationSeverity
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto)
    await this.notificationRepository.save(notification)

    this.logger.log(
      `Notification created: ${dto.type} for merchant ${dto.merchantId}`,
      {
        severity: dto.severity,
      },
    )

    // TODO: Send real-time notification via WebSocket if connected
    // TODO: Send email notification if critical

    return notification
  }

  /**
   * Create gate violation notification
   */
  async notifyGateViolation(
    merchantId: string,
    gateType: string,
    isGracePeriod: boolean,
    gracePeriodEndsAt?: Date,
  ): Promise<void> {
    const severity = isGracePeriod
      ? NotificationSeverity.WARNING
      : NotificationSeverity.CRITICAL

    const title = isGracePeriod
      ? `${gateType} Gate: Grace Period`
      : `${gateType} Gate FAILED`

    const message = isGracePeriod
      ? `Your ${gateType} gate has entered a 24-hour grace period. Please fix the issue before ${gracePeriodEndsAt?.toLocaleString()}.`
      : `Your ${gateType} gate has FAILED. Some features are now blocked.`

    await this.createNotification({
      merchantId,
      type: NotificationType.GATE_VIOLATION,
      severity,
      title,
      message,
      actionUrl: `/dashboard/gates/${gateType}`,
      actionLabel: 'View Details',
      metadata: {
        gateType,
        isGracePeriod,
        gracePeriodEndsAt,
      },
    })
  }

  /**
   * Create integration error notification
   */
  async notifyIntegrationError(
    merchantId: string,
    integration: string,
    error: string,
  ): Promise<void> {
    await this.createNotification({
      merchantId,
      type: NotificationType.INTEGRATION_ERROR,
      severity: NotificationSeverity.CRITICAL,
      title: `${integration} Integration Disconnected`,
      message: `There was an error connecting to ${integration}: ${error}. Please reconnect to restore functionality.`,
      actionUrl: '/dashboard/integrations',
      actionLabel: 'Reconnect',
      metadata: {
        integration,
        error,
      },
    })
  }

  /**
   * Create baseline ready notification
   */
  async notifyBaselineReady(
    merchantId: string,
    isProvisional: boolean,
  ): Promise<void> {
    const title = isProvisional
      ? 'Provisional Baseline Calculated'
      : 'Baseline Calculation Complete'

    const message = isProvisional
      ? 'Your provisional revenue baseline has been calculated. It will be refined as more data is collected (30 days needed for accuracy).'
      : 'Your revenue baseline has been calculated with 30+ days of data. You can now track your lift performance.'

    await this.createNotification({
      merchantId,
      type: NotificationType.BASELINE_READY,
      severity: NotificationSeverity.INFO,
      title,
      message,
      actionUrl: '/dashboard',
      actionLabel: 'View Dashboard',
      metadata: {
        isProvisional,
      },
    })
  }

  /**
   * Create weekly report ready notification
   */
  async notifyWeeklyReportReady(
    merchantId: string,
    weekEnding: Date,
  ): Promise<void> {
    await this.createNotification({
      merchantId,
      type: NotificationType.WEEKLY_REPORT_READY,
      severity: NotificationSeverity.INFO,
      title: 'Monday Ritual Report Ready',
      message: `Your weekly diagnostic report for the week ending ${weekEnding.toLocaleDateString()} is ready to review.`,
      actionUrl: '/dashboard/monday-ritual',
      actionLabel: 'View Report',
      metadata: {
        weekEnding,
      },
    })
  }

  /**
   * Create phase unlocked notification
   */
  async notifyPhaseUnlocked(
    merchantId: string,
    phase: number,
    phaseName: string,
  ): Promise<void> {
    await this.createNotification({
      merchantId,
      type: NotificationType.PHASE_UNLOCKED,
      severity: NotificationSeverity.INFO,
      title: `Phase ${phase} Unlocked: ${phaseName}`,
      message: `Congratulations! You've unlocked Phase ${phase}. Continue building your revenue scaling framework.`,
      actionUrl: `/dashboard/phase-${phase}`,
      actionLabel: 'Explore Phase',
      metadata: {
        phase,
        phaseName,
      },
    })
  }

  /**
   * Create DLQ threshold notification
   */
  async notifyDLQThreshold(
    merchantId: string,
    failedCount: number,
  ): Promise<void> {
    await this.createNotification({
      merchantId,
      type: NotificationType.DLQ_THRESHOLD,
      severity: NotificationSeverity.WARNING,
      title: 'High Number of Failed Webhooks',
      message: `${failedCount} webhooks have failed processing and are in the dead letter queue. This may indicate a data sync issue.`,
      actionUrl: '/dashboard/webhooks/dlq',
      actionLabel: 'Review Failed Webhooks',
      metadata: {
        failedCount,
      },
    })
  }

  /**
   * Get unread notifications for merchant
   */
  async getUnreadNotifications(merchantId: string, limit: number = 50): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: {
        merchantId,
        readAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    })
  }

  /**
   * Get all notifications for merchant
   */
  async getAllNotifications(
    merchantId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: {
        merchantId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      skip: offset,
    })
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId },
      { readAt: new Date() },
    )
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(merchantId: string): Promise<void> {
    await this.notificationRepository.update(
      { merchantId, readAt: IsNull() },
      { readAt: new Date() },
    )
  }

  /**
   * Get unread count
   */
  async getUnreadCount(merchantId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        merchantId,
        readAt: IsNull(),
      },
    })
  }
}
