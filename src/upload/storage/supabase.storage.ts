import { Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageProvider } from './storage.interface';

/**
 * Armazena arquivos no Supabase Storage (S3-compatible).
 * Requer: SUPABASE_URL e SUPABASE_SERVICE_KEY no .env
 */
export class SupabaseStorageProvider implements StorageProvider {
    private readonly logger = new Logger(SupabaseStorageProvider.name);
    private readonly supabase: SupabaseClient;

    constructor() {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_KEY;

        if (!url || !key) {
            throw new Error(
                'SupabaseStorageProvider: SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórias',
            );
        }

        this.supabase = createClient(url, key);
        this.logger.log('Supabase Storage inicializado');
    }

    async upload(bucket: string, filePath: string, buffer: Buffer, mimeType: string): Promise<string> {
        const { error } = await this.supabase.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: true,
            });

        if (error) {
            this.logger.error(`Upload falhou [${bucket}/${filePath}]: ${error.message}`);
            throw new Error(`Supabase upload error: ${error.message}`);
        }

        this.logger.debug(`Upload OK: ${bucket}/${filePath}`);
        return this.getPublicUrl(bucket, filePath);
    }

    getPublicUrl(bucket: string, filePath: string): string {
        const { data } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    async getSignedUrl(bucket: string, filePath: string, expiresIn = 3600): Promise<string> {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, expiresIn);

        if (error) {
            this.logger.error(`Signed URL falhou [${bucket}/${filePath}]: ${error.message}`);
            throw new Error(`Supabase signed URL error: ${error.message}`);
        }

        return data.signedUrl;
    }

    async delete(bucket: string, filePath: string): Promise<void> {
        const { error } = await this.supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            this.logger.error(`Delete falhou [${bucket}/${filePath}]: ${error.message}`);
            throw new Error(`Supabase delete error: ${error.message}`);
        }

        this.logger.debug(`Delete OK: ${bucket}/${filePath}`);
    }
}
