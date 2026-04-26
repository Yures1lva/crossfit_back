import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InscricaoService } from './inscricao.service';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { ResponseInscricaoDto } from './dto/response-inscricao.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Inscricoes')
@Controller('inscricoes')
export class InscricaoController {
    constructor(private readonly inscricaoService: InscricaoService) { }

    // Atleta se inscreve
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Post()
    async create(@Body() dto: CreateInscricaoDto, @Request() req) {
        const inscricao = await this.inscricaoService.create(dto, req.usuario.sub);
        return new ResponseInscricaoDto(inscricao);
    }

    // Admin lista inscrições de um campeonato
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Get('campeonato/:campeonatoId')
    async findByCampeonato(@Param('campeonatoId') campeonatoId: string) {
        const inscricoes = await this.inscricaoService.findByCampeonato(campeonatoId);
        return inscricoes.map((i) => new ResponseInscricaoDto(i));
    }

    // Atleta vê suas inscrições
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Get('minhas')
    async findMine(@Request() req) {
        const inscricoes = await this.inscricaoService.findByUsuario(req.usuario.sub);
        return inscricoes.map((i) => new ResponseInscricaoDto(i));
    }

    // Admin confirma pagamento
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Patch(':id/pagamento')
    async confirmarPagamento(@Param('id') id: string) {
        const inscricao = await this.inscricaoService.confirmarPagamento(id);
        return new ResponseInscricaoDto(inscricao);
    }
}
