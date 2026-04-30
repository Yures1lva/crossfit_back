/**
 * Interface genérica de Storage — desacoplada de qualquer provider.
 * Para migrar de Supabase → S3 → GCS, basta criar nova implementação.
 */
export interface StorageProvider {
    /** Faz upload de um buffer e retorna a URL pública (ou path) */
    upload(bucket: string, filePath: string, buffer: Buffer, mimeType: string): Promise<string>;

    /** Retorna URL pública de acesso ao arquivo */
    getPublicUrl(bucket: string, filePath: string): string;

    /** Retorna URL assinada temporária (para arquivos privados) */
    getSignedUrl(bucket: string, filePath: string, expiresIn?: number): Promise<string>;

    /** Remove um arquivo do storage */
    delete(bucket: string, filePath: string): Promise<void>;
}

/** Token de injeção do NestJS */
export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
