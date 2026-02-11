import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductLadder, ProductLadderStep } from './entities/product-ladder.entity'

@Injectable()
export class ProductLadderService {
  private readonly logger = new Logger(ProductLadderService.name)

  constructor(
    @InjectRepository(ProductLadder)
    private ladderRepository: Repository<ProductLadder>,
  ) {}

  /**
   * Get merchant's product ladder configuration
   */
  async getLadder(merchantId: string): Promise<ProductLadder | null> {
    return await this.ladderRepository.findOne({
      where: { merchantId, active: true },
    })
  }

  /**
   * Create or update product ladder configuration
   */
  async upsertLadder(
    merchantId: string,
    steps: ProductLadderStep[],
  ): Promise<ProductLadder> {
    // Validate steps
    this.validateSteps(steps)

    // Check if ladder exists
    let ladder = await this.ladderRepository.findOne({
      where: { merchantId, active: true },
    })

    if (ladder) {
      // Update existing
      ladder.steps = steps
      ladder.updatedAt = new Date()
    } else {
      // Create new
      ladder = this.ladderRepository.create({
        merchantId,
        steps,
        active: true,
      })
    }

    const saved = await this.ladderRepository.save(ladder)

    this.logger.log(
      `Product ladder updated for merchant ${merchantId} with ${steps.length} steps`,
    )

    return saved
  }

  /**
   * Validate product ladder steps
   */
  private validateSteps(steps: ProductLadderStep[]): void {
    if (!steps || steps.length === 0) {
      throw new Error('Product ladder must have at least one step')
    }

    if (steps.length > 3) {
      throw new Error('Product ladder cannot have more than 3 steps')
    }

    // Ensure step numbers are sequential (1, 2, 3)
    const stepNumbers = steps.map((s) => s.stepNumber).sort()
    for (let i = 0; i < stepNumbers.length; i++) {
      if (stepNumbers[i] !== i + 1) {
        throw new Error('Step numbers must be sequential (1, 2, 3)')
      }
    }

    // Ensure each step has at least one product
    for (const step of steps) {
      if (!step.productIds || step.productIds.length === 0) {
        throw new Error(`Step ${step.stepNumber} must have at least one product`)
      }
    }
  }

  /**
   * Determine which product step a product belongs to
   */
  async getProductStep(
    merchantId: string,
    productId: string,
  ): Promise<number | null> {
    const ladder = await this.getLadder(merchantId)

    if (!ladder) {
      return null
    }

    for (const step of ladder.steps) {
      if (step.productIds.includes(productId)) {
        return step.stepNumber
      }
    }

    return null
  }

  /**
   * Get products for a specific step
   */
  async getProductsForStep(
    merchantId: string,
    stepNumber: number,
  ): Promise<string[] | null> {
    const ladder = await this.getLadder(merchantId)

    if (!ladder) {
      return null
    }

    const step = ladder.steps.find((s) => s.stepNumber === stepNumber)
    return step ? step.productIds : null
  }

  /**
   * Get next step recommendation for customer
   */
  async getNextStepProducts(
    merchantId: string,
    currentStep: number,
  ): Promise<{
    stepNumber: number
    productIds: string[]
    productTitles: string[]
    name: string
  } | null> {
    const ladder = await this.getLadder(merchantId)

    if (!ladder) {
      return null
    }

    const nextStepNumber = currentStep + 1
    const nextStep = ladder.steps.find((s) => s.stepNumber === nextStepNumber)

    if (!nextStep) {
      return null // Customer is already at highest step
    }

    return {
      stepNumber: nextStep.stepNumber,
      productIds: nextStep.productIds,
      productTitles: nextStep.productTitles,
      name: nextStep.name,
    }
  }

  /**
   * Deactivate product ladder
   */
  async deactivateLadder(merchantId: string): Promise<void> {
    const ladder = await this.ladderRepository.findOne({
      where: { merchantId, active: true },
    })

    if (ladder) {
      ladder.active = false
      await this.ladderRepository.save(ladder)
      this.logger.log(`Product ladder deactivated for merchant ${merchantId}`)
    }
  }
}
