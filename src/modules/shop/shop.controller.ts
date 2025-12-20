import { Body, Controller, Post } from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from 'src/models/dto/shop.dto';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post('create')
  async create(@Body() dto: CreateShopDto) {
    return await this.shopService.create(dto);
  }
}
