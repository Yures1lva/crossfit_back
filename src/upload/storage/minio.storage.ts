import { Logger } from '@nestjs/common';
import { Client } from 'minio';
import { StorageProvider } from './storage.interface';

/**
 * Armazena arquivos no MinIO (S3-compatible, self-hosted).
 * Requer: MINIO_ENDPOINT, MINIO_PORT, MINIO_ROOT_USER, MINIO_ROOT_PASSWORD no .env
 * Opcional: MINIO_USE_SSL (default: false), MINIO_PUBLIC_URL (base pra URL pública,
 * default: monta a partir de MINIO_ENDPOINT/MINIO_PORT).
 */
export class MinioStorageProvider implements StorageProvider {
    private readonly logger = new Logger(MinioStorageProvider.name);
    private readonly client: Client;
    private readonly publicUrlBase: string;
    private readonly bucketsEnsured = new Set<string>();

    constructor() {
        const endPoint = process.env.MINIO_ENDPOINT;
        const port = Number(process.env.MINIO_PORT || 9000);
        const accessKey = process.env.MINIO_ROOT_USER;
        const secretKey = process.env.MINIO_ROOT_PASSWORD;
        const useSSL = process.env.MINIO_USE_SSL === 'true';

        if (!endPoint || !accessKey || !secretKey) {
            throw new Error(
                'MinioStorageProvider: MINIO_ENDPOINT, MINIO_ROOT_USER e MINIO_ROOT_PASSWORD são obrigatórias',
            );
        }

        this.client = new Client({ endPoint, port, useSSL, accessKey, secretKey });
        this.publicUrlBase =
            process.env.MINIO_PUBLIC_URL || `${useSSL ? 'https' : 'http'}://${endPoint}:${port}`;

        this.logger.log('MinIO Storage inicializado');
    }

    /** Garante que o bucket existe e tem leitura pública (idempotente, cacheado em memória). */
    private async ensureBucket(bucket: string): Promise<void> {
        if (this.bucketsEnsured.has(bucket)) return;

        const exists = await this.client.bucketExists(bucket).catch(() => false);
        if (!exists) {
            await this.client.makeBucket(bucket);
            this.logger.log(`Bucket criado: ${bucket}`);
        }

        // Leitura pública por padrão — buckets sensíveis (ex: comprovantes) devem
        // usar getSignedUrl() no lugar de getPublicUrl() na camada de cima.
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: { AWS: ['*'] },
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${bucket}/*`],
                },
            ],
        };
        await this.client.setBucketPolicy(bucket, JSON.stringify(policy)).catch((err) => {
            this.logger.warn(`Não foi possível setar policy pública em ${bucket}: ${err.message}`);
        });

        this.bucketsEnsured.add(bucket);
    }

    async upload(bucket: string, filePath: string, buffer: Buffer, mimeType: string): Promise<string> {
        await this.ensureBucket(bucket);

        await this.client.putObject(bucket, filePath, buffer, buffer.length, {
            'Content-Type': mimeType,
        });

        this.logger.debug(`Upload OK: ${bucket}/${filePath}`);
        return this.getPublicUrl(bucket, filePath);
    }

    getPublicUrl(bucket: string, filePath: string): string {
        return `${this.publicUrlBase}/${bucket}/${filePath}`;
    }

    async getSignedUrl(bucket: string, filePath: string, expiresIn = 3600): Promise<string> {
        try {
            return await this.client.presignedGetObject(bucket, filePath, expiresIn);
        } catch (err) {
            this.logger.error(`Signed URL falhou [${bucket}/${filePath}]: ${err.message}`);
            throw new Error(`MinIO signed URL error: ${err.message}`);
        }
    }

    async delete(bucket: string, filePath: string): Promise<void> {
        try {
            await this.client.removeObject(bucket, filePath);
            this.logger.debug(`Delete OK: ${bucket}/${filePath}`);
        } catch (err) {
            this.logger.error(`Delete falhou [${bucket}/${filePath}]: ${err.message}`);
            throw new Error(`MinIO delete error: ${err.message}`);
        }
    }
}
