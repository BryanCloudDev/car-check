import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../generated/prisma/client';
import { PrismaErrorCode } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { ConfirmLogoDto } from './dto/confirm-logo.dto';
import { LogoUploadUrlDto } from './dto/logo-upload-url.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { WorkshopResponse } from './dto/workshop.response';

/** Columnas del perfil. Excluye `logoKey`, que nunca sale del backend. */
const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  nit: true,
  logoKey: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WorkshopSelect;

/**
 * El taller ES el tenant, así que no pasa por `WorkshopScopeService` (que
 * inyecta `workshopId` en modelos hijos). Acá el scoping es `where: { id }`.
 */
@Injectable()
export class WorkshopsService {
  private readonly logger = new Logger(WorkshopsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findOne(workshopId: string): Promise<WorkshopResponse> {
    const workshop = await this.prisma.workshop
      .findUniqueOrThrow({
        where: { id: workshopId },
        select: PROFILE_SELECT,
      })
      .catch((e: unknown) => this.rethrow(e));

    return this.toResponse(workshop);
  }

  async update(
    workshopId: string,
    dto: UpdateWorkshopDto,
  ): Promise<WorkshopResponse> {
    const workshop = await this.prisma.workshop
      .update({
        where: { id: workshopId },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.email !== undefined && { email: dto.email.trim() }),
          ...(dto.phone !== undefined && { phone: blankToNull(dto.phone) }),
          ...(dto.address !== undefined && {
            address: blankToNull(dto.address),
          }),
          ...(dto.nit !== undefined && { nit: blankToNull(dto.nit) }),
        },
        select: PROFILE_SELECT,
      })
      .catch((e: unknown) => this.rethrow(e));

    return this.toResponse(workshop);
  }

  async createLogoUploadUrl(
    workshopId: string,
    dto: LogoUploadUrlDto,
  ): Promise<{ uploadUrl: string; key: string }> {
    await this.assertExists(workshopId);

    const key = `${logoPrefix(workshopId)}${randomUUID()}`;
    const uploadUrl = await this.storage.createUploadUrl(key, dto.contentType);

    return { uploadUrl, key };
  }

  async confirmLogo(
    workshopId: string,
    dto: ConfirmLogoDto,
  ): Promise<WorkshopResponse> {
    // Sin esta comprobación un taller podría apuntar su logoKey al objeto de
    // otro tenant y leerlo a través de la URL firmada que devuelve el perfil.
    if (!dto.key.startsWith(logoPrefix(workshopId))) {
      throw new BadRequestException(
        'La clave del logo no pertenece a este taller',
      );
    }

    const previous = await this.prisma.workshop
      .findUniqueOrThrow({
        where: { id: workshopId },
        select: { logoKey: true },
      })
      .catch((e: unknown) => this.rethrow(e));

    const workshop = await this.prisma.workshop.update({
      where: { id: workshopId },
      data: { logoKey: dto.key },
      select: PROFILE_SELECT,
    });

    if (previous.logoKey && previous.logoKey !== dto.key) {
      await this.discardObject(previous.logoKey);
    }

    return this.toResponse(workshop);
  }

  async removeLogo(workshopId: string): Promise<WorkshopResponse> {
    const previous = await this.prisma.workshop
      .findUniqueOrThrow({
        where: { id: workshopId },
        select: { logoKey: true },
      })
      .catch((e: unknown) => this.rethrow(e));

    const workshop = await this.prisma.workshop.update({
      where: { id: workshopId },
      data: { logoKey: null },
      select: PROFILE_SELECT,
    });

    if (previous.logoKey) {
      await this.discardObject(previous.logoKey);
    }

    return this.toResponse(workshop);
  }

  private async toResponse(
    workshop: Prisma.WorkshopGetPayload<{ select: typeof PROFILE_SELECT }>,
  ): Promise<WorkshopResponse> {
    const { logoKey, ...profile } = workshop;
    return {
      ...profile,
      logoUrl: logoKey ? await this.storage.createDownloadUrl(logoKey) : null,
    };
  }

  private async assertExists(workshopId: string): Promise<void> {
    const found = await this.prisma.workshop.findUnique({
      where: { id: workshopId },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Taller no encontrado');
    }
  }

  /**
   * Borrar el objeto viejo de S3 es limpieza, no parte del contrato: si falla,
   * queda un huérfano en el bucket pero la operación del usuario ya se guardó.
   */
  private async discardObject(key: string): Promise<void> {
    try {
      await this.storage.deleteObject(key);
    } catch (e) {
      this.logger.warn(
        `No se pudo borrar el logo anterior (${key}): ${(e as Error).message}`,
      );
    }
  }

  private rethrow(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === PrismaErrorCode.NOT_FOUND) {
        throw new NotFoundException('Taller no encontrado');
      }
      if (e.code === PrismaErrorCode.UNIQUE_VIOLATION) {
        throw new ConflictException(
          'Ese correo ya está en uso por otro taller',
        );
      }
    }
    throw e;
  }
}

/** Un campo de texto vacío desde un formulario significa "limpiar". */
function blankToNull(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function logoPrefix(workshopId: string): string {
  return `workshops/${workshopId}/logo/`;
}
