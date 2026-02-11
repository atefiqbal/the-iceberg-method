import { IsString, IsNotEmpty } from 'class-validator'

export class ShopifyOAuthCallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsNotEmpty()
  shop: string

  @IsString()
  @IsNotEmpty()
  state: string
}

export class ShopifyOAuthInitDto {
  @IsString()
  @IsNotEmpty()
  shop: string
}
