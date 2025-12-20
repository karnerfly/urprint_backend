import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import {
  DistrictResponse,
  GlobalMasterDataResponse,
  OnlyStateResponse,
  UploadExpirationResponse,
} from 'src/models/dto/masterdata.dto';

@Injectable()
export class MasterdataService {
  constructor(private database: DatabaseService) {}

  async getAllMasterdata(): Promise<GlobalMasterDataResponse> {
    const uploadExpirations = await this.database.uploadExpiration.findMany();
    const states = await this.database.state.findMany({
      include: { districts: {} },
    });

    return {
      uploadExpirations,
      states,
    };
  }

  async getExpirations(): Promise<UploadExpirationResponse[]> {
    return await this.database.uploadExpiration.findMany();
  }

  async getStates(): Promise<OnlyStateResponse[]> {
    return await this.database.state.findMany();
  }

  async getDistricts(stateId: number): Promise<DistrictResponse[]> {
    return await this.database.district.findMany({ where: { stateId } });
  }
}
