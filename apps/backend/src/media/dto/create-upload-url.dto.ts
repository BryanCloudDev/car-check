import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ALLOWED_CONTENT_TYPES, MAX_BYTES } from '../media.constants';

export class CreateUploadUrlDto {
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_BYTES.VIDEO)
  sizeBytes?: number;
}
