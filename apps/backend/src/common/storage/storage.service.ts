import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PRESIGNED_GET_URL_EXPIRES_IN,
  PRESIGNED_PUT_URL_EXPIRES_IN,
} from './storage.constants';

/**
 * Único punto de contacto con S3. Los módulos de dominio (media de órdenes,
 * logo del taller) sólo manejan keys: firmar, leer y borrar objetos vive acá.
 */
@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      region: this.config.get<string>('aws.region')!,
      credentials: {
        accessKeyId: this.config.get<string>('aws.accessKeyId')!,
        secretAccessKey: this.config.get<string>('aws.secretAccessKey')!,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    this.bucket = this.config.get<string>('aws.s3Bucket')!;
  }

  /** URL pre-firmada para que el cliente haga PUT del archivo directo a S3. */
  createUploadUrl(key: string, contentType: string): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3, cmd, {
      expiresIn: PRESIGNED_PUT_URL_EXPIRES_IN,
    });
  }

  /** URL pre-firmada de lectura, para mostrar el objeto en el navegador. */
  createDownloadUrl(key: string): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, cmd, {
      expiresIn: PRESIGNED_GET_URL_EXPIRES_IN,
    });
  }

  /** Descarga el objeto completo a memoria. Sólo para archivos chicos (logos). */
  async getObject(key: string): Promise<Buffer> {
    const res = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  async deleteObject(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
