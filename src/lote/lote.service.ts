import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Lote } from './entities/lote.entity';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { Campeonato } from '../campeonato/entities/campeonato.entity';

@Injectable()
export class LoteService {
    constructor(
        @InjectRepository(Lote)
        private readonly loteRepo: EntityRepository<Lote>,
        private readonly em: EntityManager,
    ) { }

    async create(dto: CreateLoteDto): Promise<Lote> {
        const lote = new Lote();
        lote.nome = dto.nome;
        lote.campeonato = this.em.getReference(Campeonato, dto.campeonatoId);
        lote.dataFim = new Date(dto.dataFim);
        lote.quantidadeTotal = dto.quantidadeTotal;
        lote.valoresBase = dto.valoresBase;

        this.em.persist(lote);
        await this.em.flush();
        return lote;
    }

    async update(id: string, dto: UpdateLoteDto): Promise<Lote> {
        const lote = await this.loteRepo.findOne({ id, isDeleted: false });
        if (!lote) throw new NotFoundException('Lote não encontrado');

        if (dto.nome !== undefined) lote.nome = dto.nome;
        if (dto.dataFim !== undefined) lote.dataFim = new Date(dto.dataFim);
        if (dto.quantidadeTotal !== undefined) lote.quantidadeTotal = dto.quantidadeTotal;
        if (dto.valoresBase !== undefined) lote.valoresBase = dto.valoresBase;

        await this.em.flush();
        return lote;
    }

    async remove(id: string): Promise<void> {
        const lote = await this.loteRepo.findOne({ id, isDeleted: false });
        if (!lote) throw new NotFoundException('Lote não encontrado');
        lote.isDeleted = true;
        await this.em.flush();
    }

    async findByCampeonato(campeonatoId: string): Promise<Lote[]> {
        return this.loteRepo.findAll({
            where: { campeonato: { id: campeonatoId }, isDeleted: false },
            orderBy: { dataFim: 'ASC' },
            populate: ['campeonato'],
        });
    }

    /**
     * Retorna o lote ativo do campeonato:
     * - ativo = true
     * - dataFim >= hoje
     * - vagas disponíveis (quantidadeUsada < quantidadeTotal)
     * Ordenado por dataFim ASC (pega o mais próximo de expirar)
     */
    async getLoteAtivo(campeonatoId: string): Promise<Lote | null> {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const lotes = await this.loteRepo.findAll({
            where: {
                campeonato: { id: campeonatoId },
                isDeleted: false,
                ativo: true,
            },
            orderBy: { dataFim: 'ASC' },
            populate: ['campeonato'],
        });

        // Filtra em memória: dataFim >= hoje e vagas disponíveis
        return lotes.find(
            (l) => new Date(l.dataFim) >= hoje && l.quantidadeUsada < l.quantidadeTotal,
        ) || null;
    }

    /**
     * Calcula o preço de uma inscrição baseado no lote ativo e na modalidade.
     * Retorna { valor, loteNome } ou null se não houver lote ativo.
     */
    async calcularPreco(
        campeonatoId: string,
        modalidade: string,
    ): Promise<{ valor: number; loteNome: string } | null> {
        const lote = await this.getLoteAtivo(campeonatoId);
        if (!lote) return null;

        const valor = lote.valoresBase[modalidade];

        if (valor === undefined) {
            throw new BadRequestException(
                `Modalidade "${modalidade}" não configurada no lote "${lote.nome}"`,
            );
        }

        return { valor, loteNome: lote.nome };
    }

    /**
     * Incrementa o contador de vagas usadas do lote.
     */
    async incrementarVaga(loteId: string): Promise<void> {
        const lote = await this.loteRepo.findOne({ id: loteId });
        if (lote) {
            lote.quantidadeUsada += 1;
            await this.em.flush();
        }
    }
}
