import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LoteService } from './lote.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { ResponseLoteDto } from './dto/response-lote.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Lotes')
@Controller('lotes')
export class LoteController {
    constructor(private readonly loteService: LoteService) { }

    // ── Admin ─────────────────────────────────

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Post()
    async create(@Body() dto: CreateLoteDto) {
        const lote = await this.loteService.create(dto);
        return new ResponseLoteDto(lote);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateLoteDto) {
        const lote = await this.loteService.update(id, dto);
        return new ResponseLoteDto(lote);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.loteService.remove(id);
        return { message: 'Lote removido' };
    }

    // ── Público ───────────────────────────────

    @Get('campeonato/:campeonatoId')
    async findByCampeonato(@Param('campeonatoId') campeonatoId: string) {
        const lotes = await this.loteService.findByCampeonato(campeonatoId);
        return lotes.map((l) => new ResponseLoteDto(l));
    }

    @Get('campeonato/:campeonatoId/ativo')
    async getLoteAtivo(@Param('campeonatoId') campeonatoId: string) {
        const lote = await this.loteService.getLoteAtivo(campeonatoId);
        return lote ? new ResponseLoteDto(lote) : null;
    }
}
