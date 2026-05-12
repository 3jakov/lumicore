import { IsString, Matches } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @Matches(/^Expo(nent)?PushToken\[.+\]$/, {
    message: 'token must be a valid Expo push token',
  })
  token!: string;
}
