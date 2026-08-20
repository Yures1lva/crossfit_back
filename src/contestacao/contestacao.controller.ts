import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContestacaoService } from './contestacao.service';
import { CreateContestacaoDto } from './dto/create-contestacao.dto';
import { ResolverContestacaoDto } from './dto/resolver-contestacao.dto';
import { ResponseContestacaoDto } from './dto/response-contestacao.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Contestacoes')
@Controller('campeonatos/:campeonatoId/contestacoes')
export class ContestacaoController {
    constructor(private readonly contestacaoService: ContestacaoService) {}

    // ── Atleta ────────────────────────────────

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Post()
    async create(
        @Param('campeonatoId') campeonatoId: string,
        @Body() dto: CreateContestacaoDto,
        @Request() req: any,
    ) {
        const contestacao = await this.contestacaoService.create(campeonatoId, req.usuario.sub, dto);
        return new ResponseContestacaoDto(contestacao);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Get('minhas')
    async findMinhas(@Param('campeonatoId') campeonatoId: string, @Request() req: any) {
        const lista = await this.contestacaoService.findMinhas(req.usuario.sub, campeonatoId);
        return lista.map((c) => new ResponseContestacaoDto(c));
    }

    // ── Admin ─────────────────────────────────

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Get()
    @ApiQuery({ name: 'provaId', required: false })
    @ApiQuery({ name: 'status', required: false })
    async findByCampeonato(
        @Param('campeonatoId') campeonatoId: string,
        @Query('provaId') provaId?: string,
        @Query('status') status?: string,
    ) {
        const lista = await this.contestacaoService.findByCampeonato(campeonatoId, { provaId, status });
        return lista.map((c) => new ResponseContestacaoDto(c));
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Patch(':id/resolver')
    async resolver(@Param('id') id: string, @Body() dto: ResolverContestacaoDto) {
        const contestacao = await this.contestacaoService.resolver(id, dto);
        return new ResponseContestacaoDto(contestacao);
    }
}
