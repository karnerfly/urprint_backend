export class GlobalMasterDataResponse {
  uploadExpirations: UploadExpirationResponse[];
  states: StateWithDistrictResponse[];
}

export class UploadExpirationResponse {
  id: number;
  displayText: string;
  valueInMinute: number;
  displayOrder: number;
}

export class OnlyStateResponse {
  id: number;
  displayName: string;
  stateCode: number | null;
  displayOrder: number;
}

export class StateWithDistrictResponse {
  id: number;
  displayName: string;
  stateCode: number | null;
  displayOrder: number;
  districts: DistrictResponse[];
}

export class DistrictResponse {
  id: number;
  displayName: string;
  stateId: number;
  districtCode: number | null;
  displayOrder: number;
}
