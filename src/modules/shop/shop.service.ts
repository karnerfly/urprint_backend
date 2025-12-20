import { BadRequestException, Injectable } from '@nestjs/common';
import bcryptjs from 'bcryptjs';
import { DatabaseService } from 'src/common/database/database.service';
import { getRandomBase64Url } from 'src/common/utils/random';
import { Snowflake } from 'src/common/utils/snowflake/snowflake.util';
import { CreateShopDto } from 'src/models/dto/shop.dto';
import { AuthService } from '../auth/auth.service';
import { UTokenResponse } from 'src/models/dto/auth.dto';

@Injectable()
export class ShopService {
  constructor(
    private database: DatabaseService,
    private authService: AuthService,
    private snowflake: Snowflake,
  ) {}

  async create(dto: CreateShopDto): Promise<UTokenResponse> {
    const ownerId = await this.database.shopOwner.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
      },
    });

    if (ownerId) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(dto.password, salt);

    await this.database.shop.create({
      data: {
        id: this.snowflake.generate(),
        shopName: dto.shopName,
        uploadToken: getRandomBase64Url(32),
        owner: {
          create: {
            id: this.snowflake.generate(),
            email: dto.email,
            name: dto.ownerName,
            passwordHash: hash,
            passwordSalt: salt,
            token: {
              create: {},
            },
          },
        },
      },
    });

    return this.authService.login({ email: dto.email, password: dto.password });
  }
}
