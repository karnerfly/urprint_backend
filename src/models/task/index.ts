export class EMAIL_VERIFICATION_PAYLOAD {
  name: string;
  identity: string;
  otp: string;
  timestamp: Date;
}

export class TWO_FACTOR_AUTHENTICATION_PAYLOAD {
  identity: string;
  otp: string;
  timestamp: Date;
}
