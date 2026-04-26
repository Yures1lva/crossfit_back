import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Inscricao, StatusInscricao, StatusPagamento } from './entities/inscricao.entity';
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

    // ── Atleta ────────────────────────────────

    async create(dto: CreateInscricaoDto, usuarioId: string): Promise<Inscricao> {
        const inscricao = new Inscricao();
        inscricao.usuario = this.em.getReference(Usuario, usuarioId);
        inscricao.campeonato = this.em.getReference(Campeonato, dto.campeonatoId);
        inscricao.dadosFormulario = dto.dadosFormulario;
        inscricao.categoria = dto.categoria;
        inscricao.tamanhoCamisa = dto.tamanhoCamisa;
        inscricao.comprovanteUrl = dto.comprovanteUrl;
        inscricao.fotoAtletaUrl = dto.fotoAtletaUrl;
        inscricao.observacao = dto.observacao;

        if (dto.comprovanteUrl) {
            inscricao.paymentStatus = StatusPagamento.PROOF_SENT;
            inscricao.status = StatusInscricao.PAYMENT_UPLOADED;
        }

        this.em.persist(inscricao);
        await this.em.flush();
        return inscricao;
    }

    async findByUsuario(usuarioId: string): Promise<Inscricao[]> {
        return this.inscricaoRepo.findAll({
            where: { usuario: { id: usuarioId }, isDeleted: false },
            populate: ['campeonato'],
            orderBy: { createdAt: 'DESC' },
        });
    }

    async enviarComprovante(id: string, usuarioId: string, comprovanteUrl: string): Promise<Inscricao> {
        const inscricao = await this.inscricaoRepo.findOne({
            id,
            usuario: { id: usuarioId },
            isDeleted: false,
        });
        if (!inscricao) throw new NotFoundException('Inscrição não encontrada');

        inscricao.comprovanteUrl = comprovanteUrl;
        inscricao.paymentStatus = StatusPagamento.PROOF_SENT;
        inscricao.status = StatusInscricao.PAYMENT_UPLOADED;
        await this.em.flush();
        return inscricao;
    }

    // ── Admin ─────────────────────────────────

    async findByCampeonato(
        campeonatoId: string,
        filtros?: { status?: string; categoria?: string },
    ): Promise<Inscricao[]> {
        const where: any = { campeonato: { id: campeonatoId }, isDeleted: false };
        if (filtros?.status) where.status = filtros.status;
        if (filtros?.categoria) where.categoria = filtros.categoria;

        return this.inscricaoRepo.findAll({
            where,
            populate: ['usuario', 'campeonato'],
            orderBy: { createdAt: 'DESC' },
        });
    }

    async findById(id: string): Promise<Inscricao> {
        const inscricao = await this.inscricaoRepo.findOne(
            { id, isDeleted: false },
            { populate: ['usuario', 'campeonato'] },
        );
        if (!inscricao) throw new NotFoundException('Inscrição não encontrada');
        return inscricao;
    }

    async aprovar(id: string, observacoesAdmin?: string): Promise<Inscricao> {
        const inscricao = await this.findById(id);
        inscricao.status = StatusInscricao.APPROVED;
        inscricao.paymentStatus = StatusPagamento.CONFIRMED;
        if (observacoesAdmin) inscricao.observacoesAdmin = observacoesAdmin;
        await this.em.flush();
        return inscricao;
    }

    async rejeitar(id: string, observacoesAdmin?: string): Promise<Inscricao> {
        const inscricao = await this.findById(id);
        inscricao.status = StatusInscricao.REJECTED;
        inscricao.paymentStatus = StatusPagamento.REJECTED;
        if (observacoesAdmin) inscricao.observacoesAdmin = observacoesAdmin;
        await this.em.flush();
        return inscricao;
    }

    async statsByCampeonato(campeonatoId: string) {
        const inscricoes = await this.inscricaoRepo.findAll({
            where: { campeonato: { id: campeonatoId }, isDeleted: false },
        });

        const counters: Record<string, number> = {
            pending: 0,
            awaiting_payment: 0,
            payment_uploaded: 0,
            approved: 0,
            rejected: 0,
        };
        const porCategoria: Record<string, number> = {};

        for (const i of inscricoes) {
            if (i.status in counters) counters[i.status]++;
            if (i.categoria) {
                porCategoria[i.categoria] = (porCategoria[i.categoria] || 0) + 1;
            }
        }

        return { total: inscricoes.length, ...counters, porCategoria };
    }
}
