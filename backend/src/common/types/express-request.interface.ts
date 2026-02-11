import { Request } from 'express'
import { Merchant } from '../../merchants/entities/merchant.entity'

export interface AuthenticatedRequest extends Request {
  user: {
    merchantId: string
    merchant: Merchant
  }
}
