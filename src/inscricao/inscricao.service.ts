import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Inscricao, StatusInscricao, StatusPagamento } from './entities/inscricao.entity';
import { CreateInscricaoDto } from './dto/create-inscricao.dto';
import { Usuario } from '../usuario/entities/usuario.entity';
import { Campeonato } from '../campeonato/entities/campeonato.entity';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class InscricaoService {
    constructor(
        @InjectRepository(Inscricao)
        private readonly inscricaoRepo: EntityRepository<Inscricao>,
        @InjectRepository(Campeonato)
        private readonly campeonatoRepo: EntityRepository<Campeonato>,
        private readonly em: EntityManager,
        private readonly uploadService: UploadService,
    ) { }

    /** Lê o preço da modalidade diretamente do Campeonato */
    private async resolverPreco(campeonatoId: string, modalidade?: string): Promise<{ valor: number; loteNome?: string } | null> {
        if (!modalidade) return null;

        const camp = await this.campeonatoRepo.findOne({ id: campeonatoId, isDeleted: false });
        if (!camp || !camp.precosModalidade) return null;

        const valor = camp.precosModalidade[modalidade];
        if (valor === undefined) return null;

        return { valor, loteNome: camp.loteNome };
    }

    /** Mapeia a URL do comprovante para uma Signed URL, se necessário */
    private async mapSignedUrls(inscricoes: Inscricao | Inscricao[]): Promise<void> {
        const items = Array.isArray(inscricoes) ? inscricoes : [inscricoes];
        for (const inscricao of items) {
            if (inscricao.comprovanteUrl && !inscricao.comprovanteUrl.startsWith('http')) {
                // Se for apenas o nome do arquivo, gera a Signed URL do bucket comprovantes
                try {
                    inscricao.comprovanteUrl = await this.uploadService.getSignedUrl('comprovantes', inscricao.comprovanteUrl, 3600);
                } catch (e) {
                    // Falha silenciosa ou log
                }
            }
        }
    }

    // ── Atleta autenticado ─────────────────────

    async create(dto: CreateInscricaoDto, usuarioId: string): Promise<Inscricao> {
        // ── Validação de inscrição única por CPF, e-mail ou usuário + campeonato ──
        const existente = await this.inscricaoRepo.findOne({
            $or: [
                { cpf: dto.cpf },
                { email: dto.email },
                { usuario: { id: usuarioId } },
            ],
            campeonato: { id: dto.campeonatoId },
            isDeleted: false,
            status: { $nin: [StatusInscricao.REJECTED, StatusInscricao.CANCELLED] },
        });
        if (existente) {
            throw new BadRequestException(
                'Já existe uma inscrição neste campeonato para este atleta',
            );
        }

        const inscricao = new Inscricao();
        inscricao.usuario = this.em.getReference(Usuario, usuarioId);
        inscricao.campeonato = this.em.getReference(Campeonato, dto.campeonatoId);
        inscricao.cpf = dto.cpf;
        inscricao.email = dto.email;
        inscricao.nomeAtleta = dto.nomeAtleta;
        inscricao.dadosFormulario = dto.dadosFormulario;
        inscricao.categoria = dto.categoria;
        inscricao.modalidade = dto.modalidade;
        inscricao.tamanhoCamisa = dto.tamanhoCamisa;
        inscricao.comprovanteUrl = dto.comprovanteUrl;
        inscricao.fotoAtletaUrl = dto.fotoAtletaUrl;
        inscricao.observacao = dto.observacao;

        // ── Precificação direta (do Campeonato) ──
        const preco = await this.resolverPreco(dto.campeonatoId, dto.modalidade);
        if (preco) {
            inscricao.valorPago = preco.valor;
            inscricao.loteNome = preco.loteNome;
        }

        if (dto.comprovanteUrl) {
            inscricao.paymentStatus = StatusPagamento.PROOF_SENT;
            inscricao.status = StatusInscricao.PAYMENT_UPLOADED;
        }

        this.em.persist(inscricao);
        await this.em.flush();
        return inscricao;
    }

    // ── Público (sem conta) ───────────────────

    async createPublic(dto: CreateInscricaoDto): Promise<Inscricao> {
        // ── Validação de inscrição única por CPF ou e-mail + campeonato ──
        const existente = await this.inscricaoRepo.findOne({
            $or: [{ cpf: dto.cpf }, { email: dto.email }],
            campeonato: { id: dto.campeonatoId },
            isDeleted: false,
            status: { $nin: [StatusInscricao.REJECTED, StatusInscricao.CANCELLED] },
        });
        if (existente) {
            throw new BadRequestException(
                'Já existe uma inscrição com este CPF ou e-mail neste campeonato',
            );
        }

        const inscricao = new Inscricao();
        // usuario = null (sem conta)
        inscricao.campeonato = this.em.getReference(Campeonato, dto.campeonatoId);
        inscricao.cpf = dto.cpf;
        inscricao.email = dto.email;
        inscricao.nomeAtleta = dto.nomeAtleta;
        inscricao.dadosFormulario = dto.dadosFormulario;
        inscricao.categoria = dto.categoria;
        inscricao.modalidade = dto.modalidade;
        inscricao.tamanhoCamisa = dto.tamanhoCamisa;
        inscricao.comprovanteUrl = dto.comprovanteUrl;
        inscricao.fotoAtletaUrl = dto.fotoAtletaUrl;
        inscricao.observacao = dto.observacao;

        // ── Precificação direta (do Campeonato) ──
        const preco = await this.resolverPreco(dto.campeonatoId, dto.modalidade);
        if (preco) {
            inscricao.valorPago = preco.valor;
            inscricao.loteNome = preco.loteNome;
        }

        if (dto.comprovanteUrl) {
            inscricao.paymentStatus = StatusPagamento.PROOF_SENT;
            inscricao.status = StatusInscricao.PAYMENT_UPLOADED;
        }

        this.em.persist(inscricao);
        await this.em.flush();
        return inscricao;
    }

    // ── Vinculação automática (para quando atleta criar conta) ──

    async linkToUser(usuarioId: string, cpf: string, email: string): Promise<number> {
        const orConditions: any[] = [];
        if (cpf) orConditions.push({ cpf });
        if (email) orConditions.push({ email });
        if (orConditions.length === 0) return 0;

        const inscricoes = await this.inscricaoRepo.findAll({
            where: {
                $or: orConditions,
                usuario: null,
                isDeleted: false,
            },
        });

        for (const inscricao of inscricoes) {
            inscricao.usuario = this.em.getReference(Usuario, usuarioId);
        }

        await this.em.flush();
        return inscricoes.length;
    }

    async findByUsuario(usuarioId: string): Promise<Inscricao[]> {
        const inscricoes = await this.inscricaoRepo.findAll({
            where: { usuario: { id: usuarioId }, isDeleted: false },
            populate: ['campeonato'],
            orderBy: { createdAt: 'DESC' },
        });
        await this.mapSignedUrls(inscricoes);
        return inscricoes;
    }

    async enviarComprovante(id: string, usuarioId: string, comprovanteUrl: string): Promise<Inscricao> {
        const inscricao = await this.inscricaoRepo.findOne({
            id,
            usuario: { id: usuarioId },
            isDeleted: false,
        });
        if (!inscricao) throw new NotFoundException('Inscrição não encontrada');

        if (inscricao.status === StatusInscricao.APPROVED) {
            throw new BadRequestException('Inscrição já aprovada. Não é possível alterar o comprovante.');
        }

        // ── Limite de 2 atualizações por dia ──
        const now = new Date();
        const today = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
        const lastUpdateDay = inscricao.comprovanteUpdatedAt
            ? inscricao.comprovanteUpdatedAt.toISOString().slice(0, 10)
            : null;

        // Reseta o contador se o dia mudou
        if (lastUpdateDay !== today) {
            inscricao.comprovanteUpdateCount = 0;
        }

        if (inscricao.comprovanteUpdateCount >= 2) {
            throw new BadRequestException(
                'Você já atualizou o comprovante 2 vezes hoje. Tente novamente amanhã.',
            );
        }

        inscricao.comprovanteUrl = comprovanteUrl;
        inscricao.paymentStatus = StatusPagamento.PROOF_SENT;
        inscricao.status = StatusInscricao.PAYMENT_UPLOADED;
        inscricao.comprovanteUpdatedAt = now;
        inscricao.comprovanteUpdateCount += 1;

        await this.em.flush();
        return inscricao;
    }

    async cancelarByAtleta(id: string, usuarioId: string): Promise<void> {
        const inscricao = await this.inscricaoRepo.findOne({
            id,
            usuario: { id: usuarioId },
            isDeleted: false,
        });
        if (!inscricao) throw new NotFoundException('Inscrição não encontrada');
        if (inscricao.status === StatusInscricao.APPROVED) {
            throw new BadRequestException('Não é possível cancelar uma inscrição já aprovada');
        }

        inscricao.status = StatusInscricao.CANCELLED;
        inscricao.isDeleted = true;
        await this.em.flush();
    }

    // ── Admin ─────────────────────────────────

    async findByCampeonato(
        campeonatoId: string,
        filtros?: { status?: string; categoria?: string },
    ): Promise<Inscricao[]> {
        const where: any = { campeonato: { id: campeonatoId }, isDeleted: false };
        if (filtros?.status) where.status = filtros.status;
        if (filtros?.categoria) where.categoria = filtros.categoria;

        const inscricoes = await this.inscricaoRepo.findAll({
            where,
            populate: ['usuario', 'campeonato'],
            orderBy: { createdAt: 'DESC' },
        });
        await this.mapSignedUrls(inscricoes);
        return inscricoes;
    }

    async findById(id: string): Promise<Inscricao> {
        const inscricao = await this.inscricaoRepo.findOne(
            { id, isDeleted: false },
            { populate: ['usuario', 'campeonato'] },
        );
        if (!inscricao) throw new NotFoundException('Inscrição não encontrada');
        await this.mapSignedUrls(inscricao);
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
