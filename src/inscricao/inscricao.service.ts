import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Inscricao, StatusPagamento } from './entities/inscricao.entity';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { Usuario } from '../usuario/entities/usuario.entity';
import { Campeonato } from '../campeonato/entities/campeonato.entity';

@Injectable()
export class InscricaoService {
    constructor(
        @InjectRepository(Inscricao)
        private readonly inscricaoRepo: EntityRepository<Inscricao>,
        private readonly em: EntityManager,
    ) { }

    async findByCampeonato(campeonatoId: string): Promise<Inscricao[]> {
        return this.inscricaoRepo.findAll({
            where: { campeonato: { id: campeonatoId }, isDeleted: false },
            populate: ['usuario'],
            orderBy: { createdAt: 'DESC' },
        });
    }

    async findByUsuario(usuarioId: string): Promise<Inscricao[]> {
        return this.inscricaoRepo.findAll({
            where: { usuario: { id: usuarioId }, isDeleted: false },
            populate: ['campeonato'],
            orderBy: { createdAt: 'DESC' },
        });
    }

    async create(dto: CreateInscricaoDto, usuarioId: string): Promise<Inscricao> {
        const inscricao = new Inscricao();
        inscricao.usuario = this.em.getReference(Usuario, usuarioId);
        inscricao.campeonato = this.em.getReference(Campeonato, dto.campeonatoId);
        inscricao.dadosFormulario = dto.dadosFormulario;
        inscricao.observacao = dto.observacao;
        this.em.persist(inscricao);
        await this.em.flush();
        return inscricao;
    }

    async confirmarPagamento(id: string): Promise<Inscricao> {
        const inscricao = await this.inscricaoRepo.findOne({ id, isDeleted: false });
        if (!inscricao) throw new NotFoundException('Inscrição não encontrada');
        inscricao.paymentStatus = StatusPagamento.CONFIRMED;
        await this.em.flush();
        return inscricao;
    }
}
