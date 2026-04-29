import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseUsuarioDto } from './dto/response-usuario.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUsuarioDto } from './dto/admin-update-usuario.dto';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) { }

    // ── Perfil do usuário logado ──────────────

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Get('me')
    async getProfile(@Request() req: any) {
        const usuario = await this.usuarioService.findOne(req.usuario.sub);
        if (!usuario) throw new Error('Usuário não encontrado');
        return new ResponseUsuarioDto(usuario);
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard)
    @Patch('me')
    async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
        const usuario = await this.usuarioService.updateProfile(req.usuario.sub, dto);
        return new ResponseUsuarioDto(usuario);
    }

    // ── Admin ────────────────────────────────

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get()
    async findAll() {
        const usuarios = await this.usuarioService.findAll();
        return usuarios.map((u) => new ResponseUsuarioDto(u));
    }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id/admin')
    async adminUpdate(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: AdminUpdateUsuarioDto,
    ) {
        const usuario = await this.usuarioService.adminUpdateUser(id, req.usuario.sub, dto);
        return new ResponseUsuarioDto(usuario);
    }
}

