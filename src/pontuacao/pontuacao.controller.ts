import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PontuacaoService } from './pontuacao.service';
import { UpsertPontuacaoDto } from './dto/upsert-pontuacao.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Pontuacao')
@Controller('campeonatos/:campeonatoId/pontuacoes')
export class PontuacaoController {
    constructor(private readonly pontuacaoService: PontuacaoService) {}

    /** Tabela geral pública por categoria */
    @Get('tabela')
    @ApiQuery({ name: 'categoria', required: true })
    async tabelaGeral(
        @Param('campeonatoId') campeonatoId: string,
        @Query('categoria') categoria: string,
    ) {
        return this.pontuacaoService.tabelaGeral(campeonatoId, categoria);
    }

    /** Pontuações por prova + categoria (público) */
    @Get('prova/:provaId')
    @ApiQuery({ name: 'categoria', required: true })
    async findByProva(
        @Param('provaId') provaId: string,
        @Query('categoria') categoria: string,
    ) {
        return this.pontuacaoService.findByProvaCategoria(provaId, categoria);
    }

    /** Pontuações de uma inscrição específica (público) */
    @Get('inscricao/:inscricaoId')
    async findByInscricao(@Param('inscricaoId') inscricaoId: string) {
        return this.pontuacaoService.findByInscricao(inscricaoId);
    }

    /** Upsert pontuação (admin) */
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Post()
    async upsert(@Param('campeonatoId') campeonatoId: string, @Body() dto: UpsertPontuacaoDto) {
        return this.pontuacaoService.upsert(campeonatoId, dto);
    }

    /** Limpar prova de uma categoria (admin) */
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Delete('prova/:provaId/limpar')
    @ApiQuery({ name: 'categoria', required: true })
    async limparProva(
        @Param('provaId') provaId: string,
        @Query('categoria') categoria: string,
    ) {
        await this.pontuacaoService.limparProva(provaId, categoria);
        return { success: true };
    }
}
