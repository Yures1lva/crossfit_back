import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Pontuacao } from './entities/pontuacao.entity';
import { UpsertPontuacaoDto } from './dto/upsert-pontuacao.dto';
import { Campeonato } from '../campeonato/entities/campeonato.entity';
import { Prova } from '../prova/entities/prova.entity';
import { Inscricao } from '../inscricao/entities/inscricao.entity';
import { TipoValorProva } from '../prova/entities/prova.entity';
import { provaElegivelParaCategoriaKey } from '../common/utils/categoria.util';

@Injectable()
export class PontuacaoService {
    constructor(
        @InjectRepository(Pontuacao)
        private readonly pontuacaoRepo: EntityRepository<Pontuacao>,
        @InjectRepository(Prova)
        private readonly provaRepo: EntityRepository<Prova>,
        @InjectRepository(Inscricao)
        private readonly inscricaoRepo: EntityRepository<Inscricao>,
        private readonly em: EntityManager,
    ) {}

    /** Pontos por posição: 1°=100, 2°=94, 3°+=94-(pos-2)*4 */
    private calcularPontos(posicao: number): number {
        if (posicao === 1) return 100;
        if (posicao === 2) return 94;
        return Math.max(0, 94 - (posicao - 2) * 4);
    }

    /** Recalcula posições e pontos de todas as pontuações de uma prova para uma categoria */
    private async recalcularPosicoes(provaId: string, categoria: string, menorVence: boolean): Promise<void> {
        const pontuacoes = await this.pontuacaoRepo.findAll({
            where: { prova: { id: provaId } },
            populate: ['inscricao'],
        });

        const daCategoria = pontuacoes.filter((p) => {
            const insc = p.inscricao as Inscricao;
            const cat = [insc.modalidade, insc.categoria].filter(Boolean).join('|');
            return cat === categoria;
        });

        const comValor = daCategoria.filter((p) => p.valor !== null && p.valor !== undefined);
        const semValor = daCategoria.filter((p) => p.valor === null || p.valor === undefined);

        comValor.sort((a, b) =>
            menorVence ? (a.valor! - b.valor!) : (b.valor! - a.valor!),
        );

        comValor.forEach((p, i) => {
            p.posicao = i + 1;
            p.pontos = this.calcularPontos(i + 1);
        });
        semValor.forEach((p) => {
            p.posicao = undefined;
            p.pontos = undefined;
        });

        await this.em.flush();
    }

    /** Retorna pontuações de uma prova para todas as inscrições de uma categoria */
    async findByProvaCategoria(provaId: string, categoriaKey: string) {
        const pontuacoes = await this.pontuacaoRepo.findAll({
            where: { prova: { id: provaId } },
            populate: ['inscricao', 'prova'],
        });

        return pontuacoes.filter((p) => {
            const insc = p.inscricao as Inscricao;
            const cat = [insc.modalidade, insc.categoria].filter(Boolean).join('|');
            return cat === categoriaKey;
        });
    }

    /** Retorna todas as pontuações do campeonato */
    async findByCampeonato(campeonatoId: string) {
        return this.pontuacaoRepo.findAll({
            where: { campeonato: { id: campeonatoId } },
            populate: ['inscricao', 'prova'],
        });
    }

    /** Retorna pontuações agrupadas por inscricao para a tabela geral de uma categoria */
    async tabelaGeral(campeonatoId: string, categoriaKey: string) {
        const todasProvas = await this.provaRepo.findAll({
            where: { campeonato: { id: campeonatoId }, isDeleted: false },
            orderBy: { ordem: 'ASC', createdAt: 'ASC' },
        });
        const provas = todasProvas.filter((p) => provaElegivelParaCategoriaKey(p, categoriaKey));

        const pontuacoes = await this.pontuacaoRepo.findAll({
            where: { campeonato: { id: campeonatoId } },
            populate: ['inscricao', 'prova'],
        });

        // Filtra inscrições da categoria
        const inscricoesDaCategoria = new Map<string, Inscricao>();
        pontuacoes.forEach((p) => {
            const insc = p.inscricao as Inscricao;
            const cat = [insc.modalidade, insc.categoria].filter(Boolean).join('|');
            if (cat === categoriaKey) {
                inscricoesDaCategoria.set(insc.id, insc);
            }
        });

        // Monta linha por atleta
        const rows = Array.from(inscricoesDaCategoria.values()).map((insc) => {
            const pontosPorProva: Record<string, number | null> = {};
            let totalPontos = 0;

            provas.forEach((prova) => {
                const pont = pontuacoes.find(
                    (p) => (p.prova as Prova).id === prova.id && (p.inscricao as Inscricao).id === insc.id,
                );
                const pts = pont?.pontos ?? null;
                pontosPorProva[prova.id] = pts;
                if (pts !== null) totalPontos += pts;
            });

            return {
                inscricaoId: insc.id,
                nomeAtleta: insc.nomeAtleta,
                modalidade: insc.modalidade,
                categoria: insc.categoria,
                box: (insc.dadosFormulario as any)?.box ?? '',
                parceiros: insc.parceiros,
                pontosPorProva,
                totalPontos,
            };
        });

        // Ordena por total (maior primeiro)
        rows.sort((a, b) => b.totalPontos - a.totalPontos);
        rows.forEach((r, i) => { (r as any).posicaoGeral = i + 1; });

        return { provas: provas.map((p) => ({ id: p.id, nome: p.nome, cor: p.cor, categorias: p.categorias, sexo: p.sexo, horaInicio: p.horaInicio })), rows };
    }

    /** Upsert de pontuação. Recalcula posições após salvar. */
    async upsert(campeonatoId: string, dto: UpsertPontuacaoDto): Promise<Pontuacao> {
        const prova = await this.provaRepo.findOne({ id: dto.provaId, isDeleted: false });
        if (!prova) throw new NotFoundException('Prova não encontrada');

        const inscricao = await this.inscricaoRepo.findOne({ id: dto.inscricaoId, isDeleted: false });
        if (!inscricao) throw new NotFoundException('Inscrição não encontrada');

        let pont = await this.pontuacaoRepo.findOne({ prova: { id: dto.provaId }, inscricao: { id: dto.inscricaoId } });

        if (!pont) {
            pont = new Pontuacao();
            pont.campeonato = this.em.getReference(Campeonato, campeonatoId);
            pont.prova = this.em.getReference(Prova, dto.provaId);
            pont.inscricao = this.em.getReference(Inscricao, dto.inscricaoId);
            this.em.persist(pont);
        }

        if (dto.valor === null) {
            pont.valor = undefined;
            pont.valorDisplay = undefined;
            pont.posicao = undefined;
            pont.pontos = undefined;
        } else {
            if (dto.valor !== undefined) pont.valor = dto.valor;
            if (dto.valorDisplay !== undefined) pont.valorDisplay = dto.valorDisplay;
            if (prova.tipoValor === TipoValorProva.POSICAO_MANUAL && dto.posicaoManual !== undefined) {
                pont.posicao = dto.posicaoManual;
                pont.pontos = this.calcularPontos(dto.posicaoManual);
            }
        }

        await this.em.flush();

        // Recalcular posições de todos da mesma categoria nesta prova
        const categoriaKey = [inscricao.modalidade, inscricao.categoria].filter(Boolean).join('|');
        if (prova.tipoValor !== TipoValorProva.POSICAO_MANUAL) {
            await this.recalcularPosicoes(dto.provaId, categoriaKey, prova.menorVence);
        }

        return pont;
    }

    /** Limpa todas as pontuações de uma prova em uma categoria */
    async limparProva(provaId: string, categoriaKey: string): Promise<void> {
        const pontuacoes = await this.pontuacaoRepo.findAll({
            where: { prova: { id: provaId } },
            populate: ['inscricao'],
        });

        const daCategoria = pontuacoes.filter((p) => {
            const insc = p.inscricao as Inscricao;
            const cat = [insc.modalidade, insc.categoria].filter(Boolean).join('|');
            return cat === categoriaKey;
        });

        daCategoria.forEach((p) => {
            p.valor = undefined;
            p.valorDisplay = undefined;
            p.posicao = undefined;
            p.pontos = undefined;
        });

        await this.em.flush();
    }

    /** Lista todas as pontuações de um atleta (por inscricao) */
    async findByInscricao(inscricaoId: string) {
        return this.pontuacaoRepo.findAll({
            where: { inscricao: { id: inscricaoId } },
            populate: ['prova'],
            orderBy: { prova: { ordem: 'ASC' } },
        });
    }
}
