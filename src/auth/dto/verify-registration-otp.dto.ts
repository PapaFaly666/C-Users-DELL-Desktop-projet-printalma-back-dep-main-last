import { IsInt, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class VerifyRegistrationOtpDto {
  @Type(() => Number)
  @IsInt({ message: 'userId doit être un entier' })
  @Min(1)
  userId: number;

  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit contenir exactement 6 chiffres' })
  code: string;
}
