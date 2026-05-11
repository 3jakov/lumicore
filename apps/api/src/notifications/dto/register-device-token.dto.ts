import { IsString, Matches } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @Matches(/^ExponentPushToken\[.+\]$/, {
    message: 'token must be a valid Expo push token',
  })
  token!: string;
}
