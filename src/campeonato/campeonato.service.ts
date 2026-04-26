import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Campeonato } from './entities/campeonato.entity';
import { CreateCampeonatoDto } from './dto/create-campeonato.dto';
import { UpdateCampeonatoDto } from './dto/update-campeonato.dto';

@Injectable()
export class CampeonatoService {
    constructor(
        @InjectRepository(Campeonato)
        private readonly campeonatoRepo: EntityRepository<Campeonato>,
        private readonly em: EntityManager,
    ) { }

    async findAll(): Promise<Campeonato[]> {
        return this.campeonatoRepo.findAll({
            where: { isDeleted: false },
            orderBy: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Campeonato> {
        const campeonato = await this.campeonatoRepo.findOne({ id, isDeleted: false });
        if (!campeonato) throw new NotFoundException(`Campeonato ${id} não encontrado`);
        return campeonato;
    }

    async findBySlug(slug: string): Promise<Campeonato> {
        const campeonato = await this.campeonatoRepo.findOne({ slug, isDeleted: false });
        if (!campeonato) throw new NotFoundException(`Campeonato ${slug} não encontrado`);
        return campeonato;
    }

    async create(dto: CreateCampeonatoDto): Promise<Campeonato> {
        const campeonato = new Campeonato();
        Object.assign(campeonato, dto);
        this.em.persist(campeonato);
        await this.em.flush();
        return campeonato;
    }

    async update(id: string, dto: UpdateCampeonatoDto): Promise<Campeonato> {
        const campeonato = await this.findOne(id);
        this.campeonatoRepo.assign(campeonato, dto);
        await this.em.flush();
        return campeonato;
    }

    async remove(id: string): Promise<void> {
        const campeonato = await this.findOne(id);
        campeonato.isDeleted = true;
        await this.em.flush();
    }
}
