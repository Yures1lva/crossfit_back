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
import { CampeonatoService } from './campeonato.service';
import { CreateCampeonatoDto } from './dto/create-campeonato.dto';
import { UpdateCampeonatoDto } from './dto/update-campeonato.dto';
import { ResponseCampeonatoDto } from './dto/response-campeonato.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Campeonatos')
@Controller('campeonatos')
export class CampeonatoController {
    constructor(private readonly campeonatoService: CampeonatoService) { }

    // ── Rotas públicas ──────────────────────────────
    @Get()
    async findAll() {
        const campeonatos = await this.campeonatoService.findAll();
        return campeonatos.map((c) => new ResponseCampeonatoDto(c));
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const campeonato = await this.campeonatoService.findOne(id);
        return new ResponseCampeonatoDto(campeonato);
    }

    @Get('slug/:slug')
    async findBySlug(@Param('slug') slug: string) {
        const campeonato = await this.campeonatoService.findBySlug(slug);
        return new ResponseCampeonatoDto(campeonato);
    }

    // ── Rotas protegidas (admin only) ───────────────
    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Post()
    async create(@Body() dto: CreateCampeonatoDto) {
        const campeonato = await this.campeonatoService.create(dto);
        return new ResponseCampeonatoDto(campeonato);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'organizer')
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateCampeonatoDto) {
        const campeonato = await this.campeonatoService.update(id, dto);
        return new ResponseCampeonatoDto(campeonato);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.campeonatoService.remove(id);
        return { success: true };
    }
}
