import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { MediaType, Prisma } from '../../generated/prisma/client';
import { PrismaErrorCode } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_BYTES,
  PRESIGNED_URL_EXPIRES_IN,
} from './media.constants';

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly scope: WorkshopScopeService,
  ) {
    this.s3 = new S3Client({
      region: this.config.get<string>('aws.region')!,
      credentials: {
        accessKeyId: this.config.get<string>('aws.accessKeyId')!,
        secretAccessKey: this.config.get<string>('aws.secretAccessKey')!,
      },
    });
    this.bucket = this.config.get<string>('aws.s3Bucket')!;
  }

  async createUploadUrl(
    workshopId: string,
    orderId: string,
    dto: CreateUploadUrlDto,
  ): Promise<{ uploadUrl: string; key: string }> {
    await this.assertOrderBelongsToWorkshop(workshopId, orderId);
    this.validateSize(dto.contentType, dto.sizeBytes);

    const key = `orders/${orderId}/${randomUUID()}`;
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, cmd, {
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
    });

    return { uploadUrl, key };
  }

  async confirmUpload(
    workshopId: string,
    orderId: string,
    dto: ConfirmUploadDto,
  ) {
    await this.assertOrderBelongsToWorkshop(workshopId, orderId);

    const isImage = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(
      dto.contentType,
    );

    return this.prisma.mediaAsset.create({
      data: {
        key: dto.key,
        type: isImage ? MediaType.IMAGEN : MediaType.VIDEO,
        contentType: dto.contentType,
        sizeBytes: dto.sizeBytes,
        workOrderId: orderId,
      },
    });
  }

  private async assertOrderBelongsToWorkshop(
    workshopId: string,
    orderId: string,
  ): Promise<void> {
    try {
      await this.scope.for(workshopId).workOrder.findFirstOrThrow({
        where: { id: orderId },
        select: { id: true },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PrismaErrorCode.NOT_FOUND
      ) {
        throw new NotFoundException('Orden de trabajo no encontrada');
      }
      throw e;
    }
  }

  private validateSize(contentType: string, sizeBytes?: number): void {
    if (sizeBytes === undefined) return;
    const isImage = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(
      contentType,
    );
    const maxBytes = isImage ? MAX_BYTES.IMAGE : MAX_BYTES.VIDEO;
    if (sizeBytes > maxBytes) {
      const maxMb = maxBytes / 1024 / 1024;
      throw new BadRequestException(
        `El archivo excede el tamaño máximo de ${maxMb} MB`,
      );
    }
  }
}
