import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Bateria } from './entities/bateria.entity';
import { CreateBateriaDto } from './dto/create-bateria.dto';
import { UpdateBateriaDto } from './dto/update-bateria.dto';
import { Campeonato } from '../campeonato/entities/campeonato.entity';
import { Prova } from '../prova/entities/prova.entity';
import { Inscricao } from '../inscricao/entities/inscricao.entity';

@Injectable()
export class BateriaService {
    constructor(
        @InjectRepository(Bateria)
        private readonly bateriaRepo: EntityRepository<Bateria>,
        private readonly em: EntityManager,
    ) {}

    async findByCampeonato(campeonatoId: string): Promise<Bateria[]> {
        return this.bateriaRepo.findAll({
            where: { campeonato: { id: campeonatoId }, isDeleted: false },
            populate: ['prova'],
            orderBy: { prova: { ordem: 'ASC' }, ordem: 'ASC' },
        });
    }

    async findByProva(provaId: string): Promise<Bateria[]> {
        return this.bateriaRepo.findAll({
            where: { prova: { id: provaId }, isDeleted: false },
            orderBy: { ordem: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Bateria> {
        const bateria = await this.bateriaRepo.findOne({ id, isDeleted: false });
        if (!bateria) throw new NotFoundException('Bateria não encontrada');
        return bateria;
    }

    async create(campeonatoId: string, dto: CreateBateriaDto): Promise<Bateria> {
        const bateria = new Bateria();
        bateria.campeonato = this.em.getReference(Campeonato, campeonatoId);
        bateria.prova = this.em.getReference(Prova, dto.provaId);
        bateria.categoriaKey = dto.categoriaKey;
        bateria.nome = dto.nome;
        if (dto.arenaLabel !== undefined) bateria.arenaLabel = dto.arenaLabel;
        if (dto.horaInicio !== undefined) bateria.horaInicio = dto.horaInicio;
        if (dto.horaFim !== undefined) bateria.horaFim = dto.horaFim;
        if (dto.lanes !== undefined) bateria.lanes = dto.lanes;
        if (dto.ordem !== undefined) bateria.ordem = dto.ordem;

        this.em.persist(bateria);
        await this.em.flush();
        return bateria;
    }

    async update(id: string, dto: UpdateBateriaDto): Promise<Bateria> {
        const bateria = await this.findOne(id);
        if (dto.nome !== undefined) bateria.nome = dto.nome;
        if (dto.arenaLabel !== undefined) bateria.arenaLabel = dto.arenaLabel;
        if (dto.horaInicio !== undefined) bateria.horaInicio = dto.horaInicio;
        if (dto.horaFim !== undefined) bateria.horaFim = dto.horaFim;
        if (dto.lanes !== undefined) bateria.lanes = dto.lanes;
        if (dto.ordem !== undefined) bateria.ordem = dto.ordem;
        await this.em.flush();
        return bateria;
    }

    async remove(id: string): Promise<void> {
        const bateria = await this.findOne(id);
        bateria.isDeleted = true;
        await this.em.flush();
    }

    /** Gera baterias automaticamente para um campeonato com base nas inscrições aprovadas */
    async gerarAutomatico(campeonatoId: string, provaId: string, categoriaKey: string, raiasPorBateria: number): Promise<Bateria[]> {
        const inscricaoRepo = this.em.getRepository(Inscricao);

        const [modalidade, ...restCategoria] = categoriaKey.split('|');
        const categoria = restCategoria.join('|');

        const inscricoes = await inscricaoRepo.find({
            campeonato: { id: campeonatoId },
            isDeleted: false,
            status: 'approved' as any,
            modalidade,
            categoria,
        } as any);

        // Remove baterias existentes desta prova+categoria
        const existentes = await this.bateriaRepo.findAll({
            where: { prova: { id: provaId }, categoriaKey, isDeleted: false },
        });
        existentes.forEach((b) => { b.isDeleted = true; });
        await this.em.flush();

        const baterias: Bateria[] = [];
        let bateriaIdx = 1;

        for (let i = 0; i < inscricoes.length; i += raiasPorBateria) {
            const grupo = inscricoes.slice(i, i + raiasPorBateria);
            const bateria = new Bateria();
            bateria.campeonato = this.em.getReference(Campeonato, campeonatoId);
            bateria.prova = this.em.getReference(Prova, provaId);
            bateria.categoriaKey = categoriaKey;
            bateria.nome = inscricoes.length <= raiasPorBateria ? 'Bateria Única' : `Bateria ${bateriaIdx}`;
            bateria.lanes = grupo.map((insc: Inscricao, raiaIdx: number) => ({
                raia: raiaIdx + 1,
                inscricaoId: insc.id,
                nomeAtleta: insc.nomeAtleta,
                box: (insc.dadosFormulario as any)?.box ?? '',
            }));
            bateria.ordem = bateriaIdx - 1;
            this.em.persist(bateria);
            baterias.push(bateria);
            bateriaIdx++;
        }

        await this.em.flush();
        return baterias;
    }
}
