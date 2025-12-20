import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MasterdataService } from './masterdata.service';
import {
  DistrictResponse,
  GlobalMasterDataResponse,
  OnlyStateResponse,
  UploadExpirationResponse,
} from 'src/models/dto/masterdata.dto';

@Controller('masterdata')
export class MasterdataController {
  constructor(private readonly masterdataService: MasterdataService) {}

  @Get('all')
  async all(): Promise<GlobalMasterDataResponse> {
    return await this.masterdataService.getAllMasterdata();
  }

  @Get('states')
  async states(): Promise<OnlyStateResponse[]> {
    return await this.masterdataService.getStates();
  }

  @Get('districts/:stateId')
  async districts(
    @Param('stateId', ParseIntPipe) stateId: number,
  ): Promise<DistrictResponse[]> {
    return await this.masterdataService.getDistricts(stateId);
  }

  @Get('upload/expirations')
  async uploadExpirations(): Promise<UploadExpirationResponse[]> {
    return await this.masterdataService.getExpirations();
  }
}
