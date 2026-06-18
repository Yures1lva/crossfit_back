import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Prova } from './entities/prova.entity';
import { CreateProvaDto } from './dto/create-prova.dto';
import { UpdateProvaDto } from './dto/update-prova.dto';
import { Campeonato } from '../campeonato/entities/campeonato.entity';

@Injectable()
export class ProvaService {
    constructor(
        @InjectRepository(Prova)
        private readonly provaRepo: EntityRepository<Prova>,
        private readonly em: EntityManager,
    ) {}

    async findByCampeonato(campeonatoId: string): Promise<Prova[]> {
        return this.provaRepo.findAll({
            where: { campeonato: { id: campeonatoId }, isDeleted: false },
            orderBy: { ordem: 'ASC', createdAt: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Prova> {
        const prova = await this.provaRepo.findOne({ id, isDeleted: false });
        if (!prova) throw new NotFoundException('Prova não encontrada');
        return prova;
    }

    async create(campeonatoId: string, dto: CreateProvaDto): Promise<Prova> {
        const prova = new Prova();
        prova.campeonato = this.em.getReference(Campeonato, campeonatoId);
        prova.nome = dto.nome;
        if (dto.tipoValor !== undefined) prova.tipoValor = dto.tipoValor;
        if (dto.unidade !== undefined) prova.unidade = dto.unidade;
        if (dto.timecap !== undefined) prova.timecap = dto.timecap;
        if (dto.videoUrl !== undefined) prova.videoUrl = dto.videoUrl;
        if (dto.tarefas !== undefined) prova.tarefas = dto.tarefas;
        if (dto.cor !== undefined) prova.cor = dto.cor;
        if (dto.status !== undefined) prova.status = dto.status;
        if (dto.menorVence !== undefined) prova.menorVence = dto.menorVence;
        if (dto.ordem !== undefined) prova.ordem = dto.ordem;

        this.em.persist(prova);
        await this.em.flush();
        return prova;
    }

    async update(id: string, dto: UpdateProvaDto): Promise<Prova> {
        const prova = await this.findOne(id);
        if (dto.nome !== undefined) prova.nome = dto.nome;
        if (dto.tipoValor !== undefined) prova.tipoValor = dto.tipoValor;
        if (dto.unidade !== undefined) prova.unidade = dto.unidade;
        if (dto.timecap !== undefined) prova.timecap = dto.timecap;
        if (dto.videoUrl !== undefined) prova.videoUrl = dto.videoUrl;
        if (dto.tarefas !== undefined) prova.tarefas = dto.tarefas;
        if (dto.cor !== undefined) prova.cor = dto.cor;
        if (dto.status !== undefined) prova.status = dto.status;
        if (dto.menorVence !== undefined) prova.menorVence = dto.menorVence;
        if (dto.ordem !== undefined) prova.ordem = dto.ordem;
        await this.em.flush();
        return prova;
    }

    async remove(id: string): Promise<void> {
        const prova = await this.findOne(id);
        prova.isDeleted = true;
        await this.em.flush();
    }
}
