import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
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
        @Body('parceiros') parceiros: { nome: string; cpf: string; tamanhoCamisa: string }[],
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
    @Delete(':id')
    async cancelar(@Param('id') id: string, @Request() req: any) {
        await this.inscricaoService.cancelarByAtleta(id, req.usuario.sub);
        return { success: true };
    }

    // ── Admin ─────────────────────────────────

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Get('campeonato/:campeonatoId')
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'categoria', required: false })
    async findByCampeonato(
        @Param('campeonatoId') campeonatoId: string,
        @Query('status') status?: string,
        @Query('categoria') categoria?: string,
    ) {
        const inscricoes = await this.inscricaoService.findByCampeonato(campeonatoId, {
            status,
            categoria,
        });
        return inscricoes.map((i) => new ResponseInscricaoDto(i));
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
    @Patch(':id/parceiros-admin')
    async atualizarParceirosAdmin(
        @Param('id') id: string,
        @Body('parceiros') parceiros: { nome: string; cpf: string; tamanhoCamisa: string }[],
    ) {
        const inscricao = await this.inscricaoService.atualizarParceirosAdmin(id, parceiros);
        return new ResponseInscricaoDto(inscricao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Get('campeonato/:campeonatoId/stats')
    async stats(@Param('campeonatoId') campeonatoId: string) {
        return this.inscricaoService.statsByCampeonato(campeonatoId);
    }
}
