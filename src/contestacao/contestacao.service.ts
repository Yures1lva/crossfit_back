import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Contestacao } from './entities/contestacao.entity';
import { CreateContestacaoDto } from './dto/create-contestacao.dto';
import { ResolverContestacaoDto } from './dto/resolver-contestacao.dto';
import { Campeonato } from '../campeonato/entities/campeonato.entity';
import { Prova, StatusProva } from '../prova/entities/prova.entity';
import { Inscricao } from '../inscricao/entities/inscricao.entity';

@Injectable()
export class ContestacaoService {
    constructor(
        @InjectRepository(Contestacao)
        private readonly contestacaoRepo: EntityRepository<Contestacao>,
        @InjectRepository(Prova)
        private readonly provaRepo: EntityRepository<Prova>,
        @InjectRepository(Inscricao)
        private readonly inscricaoRepo: EntityRepository<Inscricao>,
        private readonly em: EntityManager,
    ) {}

    async create(
        campeonatoId: string,
        usuarioId: string,
        dto: CreateContestacaoDto,
    ): Promise<Contestacao> {
        const prova = await this.provaRepo.findOne({
            id: dto.provaId,
            campeonato: { id: campeonatoId },
            isDeleted: false,
        });
        if (!prova) throw new NotFoundException('Prova não encontrada');

        if (prova.status !== StatusProva.CONCLUIDA || !prova.concluidaEm) {
            throw new BadRequestException(
                'Contestações só podem ser abertas depois que a prova for concluída.',
            );
        }

        const prazoMs = prova.janelaContestacaoMin * 60_000;
        if (Date.now() - prova.concluidaEm.getTime() > prazoMs) {
            throw new BadRequestException('O prazo para contestar esta prova já encerrou.');
        }

        // Ownership: a inscrição precisa pertencer ao usuário logado
        const inscricao = await this.inscricaoRepo.findOne({
            id: dto.inscricaoId,
            usuario: { id: usuarioId },
            campeonato: { id: campeonatoId },
            isDeleted: false,
        });
        if (!inscricao) throw new NotFoundException('Inscrição não encontrada');

        const contestacao = new Contestacao();
        contestacao.campeonato = this.em.getReference(Campeonato, campeonatoId);
        contestacao.prova = prova;
        contestacao.inscricao = inscricao;
        contestacao.mensagem = dto.mensagem;

        this.em.persist(contestacao);
        await this.em.flush();
        return contestacao;
    }

    async findByCampeonato(
        campeonatoId: string,
        filtros?: { provaId?: string; status?: string },
    ): Promise<Contestacao[]> {
        const where: any = { campeonato: { id: campeonatoId } };
        if (filtros?.provaId) where.prova = { id: filtros.provaId };
        if (filtros?.status) where.status = filtros.status;

        return this.contestacaoRepo.findAll({
            where,
            populate: ['prova', 'inscricao'],
            orderBy: { createdAt: 'DESC' },
        });
    }

    /** Contestações abertas pelo próprio atleta logado (qualquer inscrição dele nesse campeonato) */
    async findMinhas(usuarioId: string, campeonatoId: string): Promise<Contestacao[]> {
        return this.contestacaoRepo.findAll({
            where: {
                campeonato: { id: campeonatoId },
                inscricao: { usuario: { id: usuarioId } },
            },
            populate: ['prova', 'inscricao'],
            orderBy: { createdAt: 'DESC' },
        });
    }

    async resolver(id: string, dto: ResolverContestacaoDto): Promise<Contestacao> {
        const contestacao = await this.contestacaoRepo.findOne(
            { id },
            { populate: ['prova', 'inscricao'] },
        );
        if (!contestacao) throw new NotFoundException('Contestação não encontrada');

        contestacao.status = dto.status;
        if (dto.respostaAdmin !== undefined) contestacao.respostaAdmin = dto.respostaAdmin;
        contestacao.resolvidoEm = new Date();

        await this.em.flush();
        return contestacao;
    }
}
