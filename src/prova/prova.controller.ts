import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProvaService } from './prova.service';
import { CreateProvaDto } from './dto/create-prova.dto';
import { UpdateProvaDto } from './dto/update-prova.dto';
import { ResponseProvaDto } from './dto/response-prova.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Provas')
@Controller('campeonatos/:campeonatoId/provas')
export class ProvaController {
    constructor(private readonly provaService: ProvaService) {}

    @Get()
    async findAll(@Param('campeonatoId') campeonatoId: string) {
        const provas = await this.provaService.findByCampeonato(campeonatoId);
        return provas.map((p) => new ResponseProvaDto(p));
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return new ResponseProvaDto(await this.provaService.findOne(id));
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Post()
    async create(@Param('campeonatoId') campeonatoId: string, @Body() dto: CreateProvaDto) {
        return new ResponseProvaDto(await this.provaService.create(campeonatoId, dto));
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateProvaDto) {
        return new ResponseProvaDto(await this.provaService.update(id, dto));
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.provaService.remove(id);
        return { success: true };
    }
}
