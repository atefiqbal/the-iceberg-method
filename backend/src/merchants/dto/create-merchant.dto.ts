import { IsString, IsEmail, IsOptional } from 'class-validator'

export class CreateMerchantDto {
  @IsString()
  shopifyDomain: string

  @IsEmail()
  email: string

  @IsString()
  @IsOptional()
  businessName?: string

  @IsString()
  @IsOptional()
  timezone?: string
}
