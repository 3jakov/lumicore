import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreatePhotoCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;
}
