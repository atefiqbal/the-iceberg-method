import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { AuthenticatedRequest } from '../common/types/express-request.interface'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get unread notifications
   * GET /notifications?unread=true
   */
  @Get()
  async getNotifications(
    @Request() req: AuthenticatedRequest,
    @Query('unread') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (unreadOnly === 'true') {
      const notifications = await this.notificationsService.getUnreadNotifications(
        req.user.merchantId,
        limit ? parseInt(limit, 10) : 50,
      )
      return {
        merchantId: req.user.merchantId,
        notifications,
        unreadCount: notifications.length,
      }
    }

    const notifications = await this.notificationsService.getAllNotifications(
      req.user.merchantId,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
    )
    const unreadCount = await this.notificationsService.getUnreadCount(
      req.user.merchantId,
    )

    return {
      merchantId: req.user.merchantId,
      notifications,
      unreadCount,
    }
  }

  /**
   * Get unread count
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    const count = await this.notificationsService.getUnreadCount(req.user.merchantId)
    return {
      unreadCount: count,
    }
  }

  /**
   * Mark notification as read
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    await this.notificationsService.markAsRead(id)
    return {
      success: true,
      message: 'Notification marked as read',
    }
  }

  /**
   * Mark all notifications as read
   * POST /notifications/mark-all-read
   */
  @Post('mark-all-read')
  async markAllAsRead(@Request() req: AuthenticatedRequest) {
    await this.notificationsService.markAllAsRead(req.user.merchantId)
    return {
      success: true,
      message: 'All notifications marked as read',
    }
  }
}
