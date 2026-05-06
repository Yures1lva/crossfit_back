import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { AuthGuard } from '../auth/guards/auth.guard';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_MIMES = [...IMAGE_MIMES, 'application/pdf'];
const PUBLIC_SUBFOLDERS = ['atletas', 'comprovantes', 'documentos', 'regulamentos'];

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    // ── Autenticados ─────────────────────────

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Post('image/:subfolder')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Param('subfolder') subfolder: string,
    ) {
        if (!file) throw new BadRequestException('Nenhum arquivo enviado');
        if (file.size > MAX_SIZE) throw new BadRequestException('Arquivo muito grande (máx 5MB)');
        if (!IMAGE_MIMES.includes(file.mimetype)) {
            throw new BadRequestException('Formato inválido. Use JPG, PNG ou WebP');
        }

        const url = await this.uploadService.saveFile(file, subfolder);
        return { url };
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Post('document/:subfolder')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Param('subfolder') subfolder: string,
    ) {
        if (!file) throw new BadRequestException('Nenhum arquivo enviado');
        if (file.size > MAX_SIZE) throw new BadRequestException('Arquivo muito grande (máx 5MB)');
        if (!DOCUMENT_MIMES.includes(file.mimetype)) {
            throw new BadRequestException('Formato inválido. Use JPG, PNG, WebP ou PDF');
        }

        const url = await this.uploadService.saveFile(file, subfolder);
        return { url };
    }

    // ── Públicos (sem auth) — restritos a subfolders seguros ──

    @Post('public/image/:subfolder')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadPublicImage(
        @UploadedFile() file: Express.Multer.File,
        @Param('subfolder') subfolder: string,
    ) {
        if (!PUBLIC_SUBFOLDERS.includes(subfolder)) {
            throw new BadRequestException('Subfolder não permitido');
        }
        if (!file) throw new BadRequestException('Nenhum arquivo enviado');
        if (file.size > MAX_SIZE) throw new BadRequestException('Arquivo muito grande (máx 5MB)');
        if (!IMAGE_MIMES.includes(file.mimetype)) {
            throw new BadRequestException('Formato inválido. Use JPG, PNG ou WebP');
        }

        const url = await this.uploadService.saveFile(file, subfolder);
        return { url };
    }

    @Post('public/document/:subfolder')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadPublicDocument(
        @UploadedFile() file: Express.Multer.File,
        @Param('subfolder') subfolder: string,
    ) {
        if (!PUBLIC_SUBFOLDERS.includes(subfolder)) {
            throw new BadRequestException('Subfolder não permitido');
        }
        if (!file) throw new BadRequestException('Nenhum arquivo enviado');
        if (file.size > MAX_SIZE) throw new BadRequestException('Arquivo muito grande (máx 5MB)');
        if (!DOCUMENT_MIMES.includes(file.mimetype)) {
            throw new BadRequestException('Formato inválido. Use JPG, PNG, WebP ou PDF');
        }

        const url = await this.uploadService.saveFile(file, subfolder);
        return { url };
    }
}
