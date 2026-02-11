import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common'
import { TemplatesService } from './templates.service'
import { TemplateType, EmailTemplateStep } from './entities/email-template.entity'

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /**
   * Get all system templates (proven templates)
   */
  @Get('system')
  async getSystemTemplates() {
    return await this.templatesService.getSystemTemplates()
  }

  /**
   * Get merchant's customized templates
   */
  @Get(':merchantId')
  async getMerchantTemplates(@Param('merchantId') merchantId: string) {
    return await this.templatesService.getMerchantTemplates(merchantId)
  }

  /**
   * Get specific template by ID
   */
  @Get(':merchantId/:templateId')
  async getTemplate(
    @Param('merchantId') merchantId: string,
    @Param('templateId') templateId: string,
  ) {
    return await this.templatesService.getTemplate(templateId)
  }

  /**
   * Get active template for a flow type
   */
  @Get(':merchantId/flow/:flowType')
  async getActiveTemplateForFlow(
    @Param('merchantId') merchantId: string,
    @Param('flowType') flowType: TemplateType,
  ) {
    return await this.templatesService.getActiveTemplateForFlow(merchantId, flowType)
  }

  /**
   * Customize a system template
   */
  @Post(':merchantId/customize/:systemTemplateId')
  async customizeTemplate(
    @Param('merchantId') merchantId: string,
    @Param('systemTemplateId') systemTemplateId: string,
    @Body() body: { name?: string; steps?: EmailTemplateStep[] },
  ) {
    return await this.templatesService.customizeTemplate(
      merchantId,
      systemTemplateId,
      body,
    )
  }

  /**
   * Update merchant's custom template
   */
  @Put(':merchantId/:templateId')
  async updateTemplate(
    @Param('merchantId') merchantId: string,
    @Param('templateId') templateId: string,
    @Body() body: { name?: string; steps?: EmailTemplateStep[]; active?: boolean },
  ) {
    return await this.templatesService.updateTemplate(templateId, merchantId, body)
  }

  /**
   * Initialize system templates (admin only)
   */
  @Post('system/initialize')
  async initializeSystemTemplates() {
    await this.templatesService.initializeSystemTemplates()
    return { success: true }
  }
}
