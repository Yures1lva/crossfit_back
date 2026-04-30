import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import type { StorageProvider } from './storage';
import { STORAGE_PROVIDER } from './storage';

@Injectable()
export class UploadService {
    constructor(
        @Inject(STORAGE_PROVIDER)
        private readonly storage: StorageProvider,
    ) {}

    /**
     * Salva um arquivo no storage configurado.
     * Retorna a URL pública (local) ou absoluta (supabase).
     */
    async saveFile(
        file: Express.Multer.File,
        subfolder: string = 'geral',
    ): Promise<string> {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;

        const url = await this.storage.upload(subfolder, filename, file.buffer, file.mimetype);

        if (subfolder === 'comprovantes') {
            return filename;
        }

        return url;
    }

    /** Retorna URL pública para um arquivo */
    getPublicUrl(bucket: string, filePath: string): string {
        return this.storage.getPublicUrl(bucket, filePath);
    }

    /** Retorna URL assinada (para arquivos privados como comprovantes) */
    async getSignedUrl(bucket: string, filePath: string, expiresIn?: number): Promise<string> {
        return this.storage.getSignedUrl(bucket, filePath, expiresIn);
    }

    /** Remove um arquivo do storage */
    async deleteFile(bucket: string, filePath: string): Promise<void> {
        return this.storage.delete(bucket, filePath);
    }
}
