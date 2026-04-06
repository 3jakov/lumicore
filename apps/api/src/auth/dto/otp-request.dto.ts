import { IsPhoneNumber } from 'class-validator';

export class OtpRequestDto {
  @IsPhoneNumber()
  phone!: string;
}
