import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResponseUsuarioDto } from './dto/response-usuario.dto';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) { }

    @ApiBearerAuth('JWT-auth')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get()
    async findAll() {
        const usuarios = await this.usuarioService.findAll();
        return usuarios.map((u) => new ResponseUsuarioDto(u));
    }
}
