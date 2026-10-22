import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, LockMode } from '@mikro-orm/postgresql';
import { Bateria } from './entities/bateria.entity';
import { CreateBateriaDto } from './dto/create-bateria.dto';
import { UpdateBateriaDto } from './dto/update-bateria.dto';
import { Campeonato } from '../campeonato/entities/campeonato.entity';
import { Prova, StatusProva } from '../prova/entities/prova.entity';
import { Pontuacao } from '../pontuacao/entities/pontuacao.entity';
import { provasDaCategoriaOrdenadas } from '../common/utils/categoria.util';
import { Inscricao, StatusInscricao } from '../inscricao/entities/inscricao.entity';

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

    /**
     * Gera as baterias de uma prova/categoria com todas as inscrições ativas (exceto
     * rejeitadas/canceladas) — pendências aparecem como alerta no cronograma.
     *
     * - 1ª prova da categoria (pela ordem do cronograma dela): ordem de inscrição, quem se
     *   inscreveu primeiro nas últimas baterias.
     * - Demais provas com `bateriasPorClassificacao` ligado: pela classificação geral, no
     *   sentido escolhido no campeonato.
     * - Demais provas com o toggle desligado: ordem de inscrição, como a 1ª.
     */
    async gerarAutomatico(campeonatoId: string, provaId: string, categoriaKey: string, raiasPorBateriaOverride?: number): Promise<Bateria[]> {
        return this.em.transactional(async (em) => {
            const campeonato = await this.travarCampeonato(em, campeonatoId);
            const prova = await em.findOneOrFail(Prova, { id: provaId });
            const provas = await this.provasDaCategoria(em, campeonato, categoriaKey);
            const porClassificacao = campeonato.bateriasPorClassificacao && provas[0]?.id !== provaId;
            const ranking = porClassificacao ? await this.rankingDaCategoria(em, provas) : undefined;
            return this.montarBaterias(em, campeonato, prova, categoriaKey, ranking, raiasPorBateriaOverride);
        });
    }

    /**
     * Remonta pela classificação as baterias das provas ainda não iniciadas da categoria
     * (da 2ª em diante). Chamado a cada pontuação salva; não faz nada com o toggle desligado.
     * Provas em andamento ou concluídas ficam como estão.
     */
    async reorganizarPorClassificacao(campeonatoId: string, categoriaKey: string): Promise<void> {
        await this.em.transactional(async (em) => {
            const campeonato = await this.travarCampeonato(em, campeonatoId);
            if (!campeonato.bateriasPorClassificacao) return;

            const provas = await this.provasDaCategoria(em, campeonato, categoriaKey);
            const pendentes = provas.slice(1).filter((p) => p.status === StatusProva.CRIADA);
            if (!pendentes.length) return;

            const ranking = await this.rankingDaCategoria(em, provas);
            for (const prova of pendentes) {
                await this.montarBaterias(em, campeonato, prova, categoriaKey, ranking);
            }
        });
    }

    /** Reorganiza todas as categorias do campeonato (ao ligar o toggle, trocar o sentido, recalcular). */
    async reorganizarCampeonato(campeonatoId: string): Promise<void> {
        const campeonato = await this.em.findOneOrFail(Campeonato, { id: campeonatoId });
        for (const categoriaKey of this.categoriasDoCampeonato(campeonato)) {
            await this.reorganizarPorClassificacao(campeonatoId, categoriaKey);
        }
    }

    /** Liga/desliga a montagem pela classificação e define o sentido. */
    async salvarConfig(
        campeonatoId: string,
        dto: { bateriasPorClassificacao?: boolean; liderNaUltimaBateria?: boolean },
    ): Promise<{ bateriasPorClassificacao: boolean; liderNaUltimaBateria: boolean }> {
        const campeonato = await this.em.findOneOrFail(Campeonato, { id: campeonatoId });
        if (dto.bateriasPorClassificacao !== undefined) campeonato.bateriasPorClassificacao = dto.bateriasPorClassificacao;
        if (dto.liderNaUltimaBateria !== undefined) campeonato.liderNaUltimaBateria = dto.liderNaUltimaBateria;
        await this.em.flush();

        await this.reorganizarCampeonato(campeonatoId);
        return {
            bateriasPorClassificacao: campeonato.bateriasPorClassificacao,
            liderNaUltimaBateria: campeonato.liderNaUltimaBateria,
        };
    }

    /** Salva a ordem das provas no cronograma de uma categoria. */
    async salvarOrdemProvas(campeonatoId: string, categoriaKey: string, provaIds: string[]): Promise<Record<string, string[]>> {
        await this.em.transactional(async (em) => {
            const campeonato = await this.travarCampeonato(em, campeonatoId);
            const primeiraAntes = (await this.provasDaCategoria(em, campeonato, categoriaKey))[0];
            campeonato.ordemProvas = { ...(campeonato.ordemProvas ?? {}), [categoriaKey]: provaIds };
            await em.flush();

            // Outra prova virou a 1ª: com a montagem automática ligada, ela volta para a
            // ordem de inscrição (se ainda não começou).
            const primeira = (await this.provasDaCategoria(em, campeonato, categoriaKey))[0];
            if (
                campeonato.bateriasPorClassificacao
                && primeira && primeira.id !== primeiraAntes?.id
                && primeira.status === StatusProva.CRIADA
            ) {
                await this.montarBaterias(em, campeonato, primeira, categoriaKey);
            }
        });

        // E a nova 2ª em diante passa a seguir a classificação
        await this.reorganizarPorClassificacao(campeonatoId, categoriaKey);
        const campeonato = await this.em.findOneOrFail(Campeonato, { id: campeonatoId });
        return campeonato.ordemProvas ?? {};
    }

    // ── Montagem ─────────────────────────────────────────────

    /** Trava a linha do campeonato: pontuações salvas em paralelo não remontam baterias ao mesmo tempo. */
    private async travarCampeonato(em: EntityManager, campeonatoId: string): Promise<Campeonato> {
        const campeonato = await em.findOne(Campeonato, { id: campeonatoId }, { lockMode: LockMode.PESSIMISTIC_WRITE });
        if (!campeonato) throw new NotFoundException('Campeonato não encontrado');
        return campeonato;
    }

    private categoriasDoCampeonato(campeonato: Campeonato): string[] {
        return (campeonato.modalidades ?? []).flatMap((m: any) =>
            (m.categorias ?? []).map((c: string) => `${m.nome}|${c}`),
        );
    }

    private async provasDaCategoria(em: EntityManager, campeonato: Campeonato, categoriaKey: string): Promise<Prova[]> {
        const provas = await em.find(
            Prova,
            { campeonato: { id: campeonato.id }, isDeleted: false },
            { orderBy: { ordem: 'ASC', createdAt: 'ASC' } },
        );
        return provasDaCategoriaOrdenadas(provas, categoriaKey, campeonato.ordemProvas);
    }

    /** Total de pontos por inscrição nas provas da categoria (quem não pontuou fica com 0). */
    private async rankingDaCategoria(em: EntityManager, provas: Prova[]): Promise<Map<string, number>> {
        const pontuacoes = await em.find(Pontuacao, { prova: { $in: provas.map((p) => p.id) } });
        const totais = new Map<string, number>();
        pontuacoes.forEach((p) => {
            const id = (p.inscricao as Inscricao).id;
            totais.set(id, (totais.get(id) ?? 0) + (p.pontos ?? 0));
        });
        return totais;
    }

    /**
     * Distribui os atletas nas baterias da prova. Sem `ranking`, pela ordem de inscrição
     * (primeiros inscritos nas últimas baterias); com `ranking`, pela classificação no sentido
     * do campeonato. Os grupos são fechados a partir de quem fica no fim (inscritos mais
     * antigos ou o líder), então essa bateria sai completa e a incompleta fica na outra ponta.
     *
     * Reaproveita as baterias existentes pela ordem — horário e arena definidos no cronograma
     * não se perdem quando a montagem roda de novo.
     */
    private async montarBaterias(
        em: EntityManager,
        campeonato: Campeonato,
        prova: Prova,
        categoriaKey: string,
        ranking?: Map<string, number>,
        raiasPorBateriaOverride?: number,
    ): Promise<Bateria[]> {
        const raiasPorBateria = raiasPorBateriaOverride ?? prova.raiasPorBateria;
        const [modalidade, ...restCategoria] = categoriaKey.split('|');
        const categoria = restCategoria.join('|');

        const inscricoes = await em.find(Inscricao, {
            campeonato: { id: campeonato.id },
            isDeleted: false,
            status: { $nin: [StatusInscricao.REJECTED, StatusInscricao.CANCELLED] },
            modalidade,
            categoria,
        } as any, { orderBy: { createdAt: 'ASC', id: 'ASC' } as any });

        // `ordenados[0]` é quem vai para a ponta "do fim": o inscrito mais antigo, ou o líder.
        // Empate na classificação desempata pela ordem de inscrição (sort estável).
        const ordenados = ranking
            ? [...inscricoes].sort((a, b) => (ranking.get(b.id) ?? 0) - (ranking.get(a.id) ?? 0))
            : inscricoes;
        const primeirosNoFim = ranking ? campeonato.liderNaUltimaBateria : true;

        let grupos: Inscricao[][];
        if (prova.raiaUnica) {
            grupos = [primeirosNoFim ? [...ordenados].reverse() : ordenados];
        } else {
            grupos = [];
            for (let i = 0; i < ordenados.length; i += raiasPorBateria) {
                grupos.push(ordenados.slice(i, i + raiasPorBateria));
            }
            if (primeirosNoFim) grupos.reverse();
        }
        if (!ordenados.length) grupos = [];

        const existentes = await em.find(
            Bateria,
            { prova: { id: prova.id }, categoriaKey, isDeleted: false },
            { orderBy: { ordem: 'ASC', createdAt: 'ASC' } },
        );

        const baterias = grupos.map((grupo, idx) => {
            let bateria = existentes[idx];
            if (!bateria) {
                bateria = new Bateria();
                bateria.campeonato = em.getReference(Campeonato, campeonato.id);
                bateria.prova = em.getReference(Prova, prova.id);
                bateria.categoriaKey = categoriaKey;
                em.persist(bateria);
            }
            bateria.nome = grupos.length === 1 ? 'Bateria Única' : `Bateria ${idx + 1}`;
            bateria.ordem = idx;
            bateria.lanes = grupo.map((insc, raiaIdx) => ({
                raia: raiaIdx + 1,
                inscricaoId: insc.id,
                nomeAtleta: insc.nomeAtleta,
                box: (insc.dadosFormulario as any)?.box ?? '',
            }));
            return bateria;
        });
        existentes.slice(grupos.length).forEach((b) => { b.isDeleted = true; });

        await em.flush();
        return baterias;
    }
}
