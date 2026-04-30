import { Logger, Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { STORAGE_PROVIDER, LocalStorageProvider, SupabaseStorageProvider } from './storage';

const logger = new Logger('UploadModule');

@Module({
    controllers: [UploadController],
    providers: [
        {
            provide: STORAGE_PROVIDER,
            useFactory: () => {
                const driver = process.env.STORAGE_DRIVER || 'local';
                logger.log(`Storage driver: ${driver}`);

                if (driver === 'supabase') {
                    return new SupabaseStorageProvider();
                }
                return new LocalStorageProvider();
            },
        },
        UploadService,
    ],
    exports: [UploadService],
})
export class UploadModule {}
