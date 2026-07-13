import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Res,
    UseGuards,
    Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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

    // ── Público (sem auth) ─────────────────────

    @Post('public')
    async createPublic(@Body() dto: CreateInscricaoDto) {
        const inscricao = await this.inscricaoService.createPublic(dto);
        return new ResponseInscricaoDto(inscricao);
    }

    @Patch('public/:id/laudo-medico')
    async enviarLaudoMedicoPublic(
        @Param('id') id: string,
        @Body('laudoMedicoUrl') laudoMedicoUrl: string,
    ) {
        const inscricao = await this.inscricaoService.enviarLaudoMedicoPublic(id, laudoMedicoUrl);
        return new ResponseInscricaoDto(inscricao);
    }

    @Patch('public/:id/documento-identidade')
    async enviarDocumentoIdentidadePublic(
        @Param('id') id: string,
        @Body('documentoIdentidadeUrl') documentoIdentidadeUrl: string,
    ) {
        const inscricao = await this.inscricaoService.enviarDocumentoIdentidadePublic(id, documentoIdentidadeUrl);
        return new ResponseInscricaoDto(inscricao);
    }

    @Patch('public/:id/termo')
    async enviarTermoPublic(
        @Param('id') id: string,
        @Body('termoUrl') termoUrl: string,
    ) {
        const inscricao = await this.inscricaoService.enviarTermoPublic(id, termoUrl);
        return new ResponseInscricaoDto(inscricao);
    }

    // ── Atleta ────────────────────────────────

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Post()
    async create(@Body() dto: CreateInscricaoDto, @Request() req: any) {
        const inscricao = await this.inscricaoService.create(dto, req.usuario.sub);
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Get('minhas')
    async findMine(@Request() req: any) {
        const inscricoes = await this.inscricaoService.findByUsuario(req.usuario.sub);
        return inscricoes.map((i) => new ResponseInscricaoDto(i));
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Patch(':id/comprovante')
    async enviarComprovante(
        @Param('id') id: string,
        @Body('comprovanteUrl') comprovanteUrl: string,
        @Request() req: any,
    ) {
        const inscricao = await this.inscricaoService.enviarComprovante(
            id,
            req.usuario.sub,
            comprovanteUrl,
        );
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Patch(':id/fotos')
    async enviarFotos(
        @Param('id') id: string,
        @Body('fotosAtletas') fotosAtletas: string[],
        @Body('fotoModo') fotoModo: string,
        @Request() req: any,
    ) {
        const inscricao = await this.inscricaoService.enviarFotos(
            id,
            req.usuario.sub,
            fotosAtletas,
            fotoModo,
        );
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Patch(':id/parceiros')
    async atualizarParceiros(
        @Param('id') id: string,
        @Body('parceiros') parceiros: { nome: string; cpf: string; telefone: string; tamanhoCamisa: string }[],
        @Request() req: any,
    ) {
        const inscricao = await this.inscricaoService.atualizarParceiros(
            id,
            req.usuario.sub,
            parceiros,
        );
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Patch(':id/parceiros/:index/documento')
    async enviarDocumentoParceiro(
        @Param('id') id: string,
        @Param('index') index: string,
        @Body('tipo') tipo: 'laudoMedico' | 'documentoIdentidade' | 'termo',
        @Body('url') url: string,
        @Request() req: any,
    ) {
        const inscricao = await this.inscricaoService.enviarDocumentoParceiro(
            id,
            req.usuario.sub,
            parseInt(index, 10),
            tipo,
            url,
        );
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Patch(':id/laudo-medico')
    async enviarLaudoMedico(
        @Param('id') id: string,
        @Body('laudoMedicoUrl') laudoMedicoUrl: string,
        @Request() req: any,
    ) {
        const inscricao = await this.inscricaoService.enviarLaudoMedico(
            id,
            req.usuario.sub,
            laudoMedicoUrl,
        );
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Patch(':id/documento-identidade')
    async enviarDocumentoIdentidade(
        @Param('id') id: string,
        @Body('documentoIdentidadeUrl') documentoIdentidadeUrl: string,
        @Request() req: any,
    ) {
        const inscricao = await this.inscricaoService.enviarDocumentoIdentidade(
            id,
            req.usuario.sub,
            documentoIdentidadeUrl,
        );
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Patch(':id/termo')
    async enviarTermo(
        @Param('id') id: string,
        @Body('termoUrl') termoUrl: string,
        @Request() req: any,
    ) {
        const inscricao = await this.inscricaoService.enviarTermo(id, req.usuario.sub, termoUrl);
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Delete(':id')
    async cancelar(@Param('id') id: string, @Request() req: any) {
        await this.inscricaoService.cancelarByAtleta(id, req.usuario.sub);
        return { success: true };
    }

    // ── Admin ─────────────────────────────────

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Delete(':id/admin')
    async excluirAdmin(@Param('id') id: string) {
        await this.inscricaoService.excluirAdmin(id);
        return { success: true };
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Get('campeonato/:campeonatoId')
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'categoria', required: false })
    @ApiQuery({ name: 'modalidade', required: false })
    @ApiQuery({ name: 'sexo', required: false })
    @ApiQuery({ name: 'docs', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findByCampeonato(
        @Param('campeonatoId') campeonatoId: string,
        @Query('status') status?: string,
        @Query('categoria') categoria?: string,
        @Query('modalidade') modalidade?: string,
        @Query('sexo') sexo?: string,
        @Query('docs') docs?: string,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const paginatedResult = await this.inscricaoService.findByCampeonato(campeonatoId, {
            status,
            categoria,
            modalidade,
            sexo,
            docs,
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
        });

        return {
            ...paginatedResult,
            data: paginatedResult.data.map((i) => new ResponseInscricaoDto(i)),
        };
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Get(':id')
    async findById(@Param('id') id: string) {
        const inscricao = await this.inscricaoService.findById(id);
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Patch(':id/aprovar')
    async aprovar(
        @Param('id') id: string,
        @Body('observacoesAdmin') observacoesAdmin?: string,
    ) {
        const inscricao = await this.inscricaoService.aprovar(id, observacoesAdmin);
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Patch(':id/rejeitar')
    async rejeitar(
        @Param('id') id: string,
        @Body('observacoesAdmin') observacoesAdmin?: string,
    ) {
        const inscricao = await this.inscricaoService.rejeitar(id, observacoesAdmin);
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Post(':id/notificar')
    async renotificar(
        @Param('id') id: string,
        @Body('tipo') tipo?: 'inscricao_aprovada' | 'docs_pendentes',
    ) {
        return this.inscricaoService.renotificar(id, tipo);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Patch(':id/parceiros-admin')
    async atualizarParceirosAdmin(
        @Param('id') id: string,
        @Body('parceiros') parceiros: { nome: string; cpf: string; telefone: string; tamanhoCamisa: string }[],
    ) {
        const inscricao = await this.inscricaoService.atualizarParceirosAdmin(id, parceiros);
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Patch(':id/dados-admin')
    async atualizarDadosAdmin(
        @Param('id') id: string,
        @Body('categoria') categoria?: string,
        @Body('tamanhoCamisa') tamanhoCamisa?: string,
    ) {
        const inscricao = await this.inscricaoService.atualizarDadosAdmin(id, { categoria, tamanhoCamisa });
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Get('campeonato/:campeonatoId/stats')
    async stats(@Param('campeonatoId') campeonatoId: string) {
        return this.inscricaoService.statsByCampeonato(campeonatoId);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Get('campeonato/:campeonatoId/export')
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'categoria', required: false })
    @ApiQuery({ name: 'modalidade', required: false })
    @ApiQuery({ name: 'sexo', required: false })
    @ApiQuery({ name: 'docs', required: false })
    @ApiQuery({ name: 'search', required: false })
    async exportar(
        @Param('campeonatoId') campeonatoId: string,
        @Res() res: Response,
        @Query('status') status?: string,
        @Query('categoria') categoria?: string,
        @Query('modalidade') modalidade?: string,
        @Query('sexo') sexo?: string,
        @Query('docs') docs?: string,
        @Query('search') search?: string,
    ) {
        const { buffer, nomeArquivo } = await this.inscricaoService.exportarCampeonatoXlsx(
            campeonatoId,
            { status, categoria, modalidade, sexo, docs, search },
        );

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
}
