import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider } from './storage.interface';

/**
 * Armazena arquivos no disco local (public/uploads/).
 * Usado em desenvolvimento. Em produção, trocar para SupabaseStorageProvider.
 */
export class LocalStorageProvider implements StorageProvider {
    private readonly logger = new Logger(LocalStorageProvider.name);
    private readonly baseDir = path.join(process.cwd(), 'public', 'uploads');

    constructor() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
        this.logger.log('Local Storage inicializado');
    }

    async upload(bucket: string, filePath: string, buffer: Buffer, _mimeType: string): Promise<string> {
        const dir = path.join(this.baseDir, bucket);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fullPath = path.join(dir, filePath);
        fs.writeFileSync(fullPath, buffer);

        this.logger.debug(`Upload OK: ${bucket}/${filePath}`);
        return `/uploads/${bucket}/${filePath}`;
    }

    getPublicUrl(bucket: string, filePath: string): string {
        return `/uploads/${bucket}/${filePath}`;
    }

    async getSignedUrl(bucket: string, filePath: string, _expiresIn?: number): Promise<string> {
        // Local não tem signed URLs — retorna a URL pública
        return this.getPublicUrl(bucket, filePath);
    }

    async delete(bucket: string, filePath: string): Promise<void> {
        const fullPath = path.join(this.baseDir, bucket, filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            this.logger.debug(`Delete OK: ${bucket}/${filePath}`);
        }
    }
}
