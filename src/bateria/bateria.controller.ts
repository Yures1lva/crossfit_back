import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BateriaService } from './bateria.service';
import { CreateBateriaDto } from './dto/create-bateria.dto';
import { UpdateBateriaDto } from './dto/update-bateria.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Baterias')
@Controller('campeonatos/:campeonatoId/baterias')
export class BateriaController {
    constructor(private readonly bateriaService: BateriaService) {}

    @Get()
    async findAll(@Param('campeonatoId') campeonatoId: string) {
        return this.bateriaService.findByCampeonato(campeonatoId);
    }

    @Get('prova/:provaId')
    async findByProva(@Param('provaId') provaId: string) {
        return this.bateriaService.findByProva(provaId);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Post()
    async create(@Param('campeonatoId') campeonatoId: string, @Body() dto: CreateBateriaDto) {
        return this.bateriaService.create(campeonatoId, dto);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Post('gerar')
    @ApiQuery({ name: 'provaId', required: true })
    @ApiQuery({ name: 'categoria', required: true })
    @ApiQuery({ name: 'raias', required: false, type: Number })
    async gerarAutomatico(
        @Param('campeonatoId') campeonatoId: string,
        @Query('provaId') provaId: string,
        @Query('categoria') categoria: string,
        @Query('raias') raias?: string,
    ) {
        return this.bateriaService.gerarAutomatico(
            campeonatoId,
            provaId,
            categoria,
            raias ? parseInt(raias) : 10,
        );
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateBateriaDto) {
        return this.bateriaService.update(id, dto);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.bateriaService.remove(id);
        return { success: true };
    }
}
