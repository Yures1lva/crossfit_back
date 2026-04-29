import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CidadeService } from './cidade.service';
import { IsNotEmpty, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

class CreateCidadeDto {
    @IsNotEmpty({ message: 'Nome da cidade é obrigatório' })
    @IsString()
    @MinLength(2, { message: 'Nome muito curto (mín. 2 caracteres)' })
    @MaxLength(80, { message: 'Nome muito longo (máx. 80 caracteres)' })
    @Matches(/^[\p{L}\s\-'.]+$/u, {
        message: 'Nome contém caracteres inválidos. Use apenas letras, espaços, hífens e apóstrofos.',
    })
    nome!: string;
}

// Rate limiters: GET = 30/min, POST = 5/min (mais restritivo)
const getCidadesRateLimit = new RateLimitGuard(30, 60_000);
const createCidadeRateLimit = new RateLimitGuard(5, 60_000);

@ApiTags('Cidades')
@Controller('cidades')
export class CidadeController {
    constructor(private readonly cidadeService: CidadeService) {}

    /** Lista cidades com busca opcional — público mas rate-limited */
    @Get()
    @UseGuards(getCidadesRateLimit)
    async list(@Query('search') search?: string) {
        // Sanitiza search: limita tamanho, remove chars perigosos
        const sanitized = search
            ? search.slice(0, 80).replace(/[^\p{L}\s\-'.]/gu, '').trim()
            : undefined;

        const cidades = await this.cidadeService.list(sanitized);
        return cidades.map((c) => ({ id: c.id, name: c.nome }));
    }

    /** Cria cidade — público mas muito restrito (rate limit 5/min + validação rígida) */
    @Post()
    @UseGuards(createCidadeRateLimit)
    async create(@Body() dto: CreateCidadeDto) {
        // Proteção extra: rejeita se o nome normalizado tem menos de 2 chars úteis
        const cleaned = dto.nome.replace(/[^a-zA-ZÀ-ú]/g, '');
        if (cleaned.length < 2) {
            throw new BadRequestException('Nome de cidade inválido');
        }

        const cidade = await this.cidadeService.findOrCreate(dto.nome);
        return { id: cidade.id, name: cidade.nome };
    }
}
