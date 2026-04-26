import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/postgresql';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UsuarioService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepo: EntityRepository<Usuario>,
        private readonly em: EntityManager,
    ) { }

    async findAll(): Promise<Usuario[]> {
        return this.usuarioRepo.findAll({
            where: { isDeleted: false },
            orderBy: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Usuario | null> {
        return this.usuarioRepo.findOne({ id, isDeleted: false });
    }

    async findByEmail(email: string): Promise<Usuario | null> {
        return this.usuarioRepo.findOne({ email, isDeleted: false });
    }

    async create(dto: CreateUsuarioDto): Promise<Usuario> {
        const usuario = new Usuario();
        usuario.nome = dto.nome;
        usuario.email = dto.email;
        usuario.password = dto.password;
        this.em.persist(usuario);
        await this.em.flush();
        return usuario;
    }

    async updateRefreshToken(id: string, hashedToken: string | null): Promise<void> {
        const usuario = await this.findOne(id);
        if (!usuario) throw new NotFoundException('Usuário não encontrado');
        usuario.refreshToken = hashedToken ?? undefined;
        await this.em.flush();
    }

    async remove(id: string): Promise<void> {
        const usuario = await this.findOne(id);
        if (!usuario) throw new NotFoundException('Usuário não encontrado');
        usuario.isDeleted = true;
        await this.em.flush();
    }
}
