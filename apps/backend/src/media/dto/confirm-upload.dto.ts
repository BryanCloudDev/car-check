import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ALLOWED_CONTENT_TYPES, MAX_BYTES } from '../media.constants';

export class ConfirmUploadDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_BYTES.VIDEO)
  sizeBytes?: number;
}
