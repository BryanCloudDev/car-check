import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediaType, Prisma } from '../../generated/prisma/client';
import { PrismaErrorCode } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { ALLOWED_IMAGE_TYPES, MAX_BYTES } from './media.constants';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly scope: WorkshopScopeService,
  ) {}

  async createUploadUrl(
    workshopId: string,
    orderId: string,
    dto: CreateUploadUrlDto,
  ): Promise<{ uploadUrl: string; key: string }> {
    await this.assertOrderBelongsToWorkshop(workshopId, orderId);
    this.validateSize(dto.contentType, dto.sizeBytes);

    const key = `orders/${orderId}/${randomUUID()}`;
    const uploadUrl = await this.storage.createUploadUrl(key, dto.contentType);

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

  async listMedia(workshopId: string, orderId: string) {
    await this.assertOrderBelongsToWorkshop(workshopId, orderId);

    const assets = await this.prisma.mediaAsset.findMany({
      where: { workOrderId: orderId },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        url: await this.storage.createDownloadUrl(asset.key),
      })),
    );
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
