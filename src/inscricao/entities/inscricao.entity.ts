import { Entity, PrimaryKey, Property, ManyToOne, Enum, Index } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Campeonato } from '../../campeonato/entities/campeonato.entity';

export enum StatusInscricao {
    PENDING = 'pending',
    AWAITING_PAYMENT = 'awaiting_payment',
    PAYMENT_UPLOADED = 'payment_uploaded',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',
}

export enum StatusPagamento {
    PENDING = 'pending',
    PROOF_SENT = 'proof_sent',
    CONFIRMED = 'confirmed',
    REJECTED = 'rejected',
}

@Entity()
export class Inscricao {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuidv4();

    @ManyToOne(() => Usuario, { nullable: true })
    usuario?: Usuario;

    @ManyToOne(() => Campeonato)
    campeonato!: Campeonato;

    // ── Identidade do atleta (para inscrição sem conta) ──
    @Index()
    @Property()
    cpf!: string;

    @Index()
    @Property()
    email!: string;

    @Property({ nullable: true })
    telefone?: string;

    @Property()
    nomeAtleta!: string;

    @Enum(() => StatusInscricao)
    status: StatusInscricao = StatusInscricao.PENDING;

    @Enum(() => StatusPagamento)
    paymentStatus: StatusPagamento = StatusPagamento.PENDING;

    // ── Dados do formulário dinâmico ─────────
    @Property({ nullable: true, type: 'json' })
    dadosFormulario?: Record<string, any>;

    @Property({ nullable: true })
    categoria?: string;

    @Property({ nullable: true })
    tamanhoCamisa?: string;

    @Property({ nullable: true })
    modalidade?: string;

    // ── Parceiros (dupla/trio) ────────────────
    @Property({ nullable: true, type: 'json' })
    parceiros?: {
        nome: string;
        cpf: string;
        tamanhoCamisa?: string;
        laudoMedicoUrl?: string;
        laudoMedicoUpdatedAt?: Date;
        documentoIdentidadeUrl?: string;
        documentoIdentidadeUpdatedAt?: Date;
        termoUrl?: string;
        termoUpdatedAt?: Date;
    }[];

    // ── Uploads ──────────────────────────────
    @Property({ nullable: true })
    comprovanteUrl?: string;

    @Property({ nullable: true })
    comprovanteUpdatedAt?: Date;

    /** Quantas vezes o comprovante foi atualizado hoje */
    @Property({ default: 0 })
    comprovanteUpdateCount: number = 0;

    @Property({ nullable: true })
    fotoAtletaUrl?: string;

    // ── Fotos dos atletas (grupo ou individuais) ──
    @Property({ nullable: true, type: 'json' })
    fotosAtletas?: string[];

    /** 'grupo' = 1 foto de todos, 'individual' = 1 foto por atleta */
    @Property({ nullable: true })
    fotoModo?: string;

    @Property({ nullable: true })
    fotosUpdatedAt?: Date;

    @Property({ default: 0 })
    fotosUpdateCount: number = 0;

    // ── Documentos obrigatórios ───────────────
    @Property({ nullable: true })
    laudoMedicoUrl?: string;

    @Property({ nullable: true })
    laudoMedicoUpdatedAt?: Date;

    @Property({ nullable: true })
    documentoIdentidadeUrl?: string;

    @Property({ nullable: true })
    documentoIdentidadeUpdatedAt?: Date;

    @Property({ nullable: true })
    termoUrl?: string;

    @Property({ nullable: true })
    termoUpdatedAt?: Date;

    // ── Admin ────────────────────────────────
    @Property({ nullable: true, type: 'text' })
    observacao?: string;

    @Property({ nullable: true, type: 'text' })
    observacoesAdmin?: string;

    // ── Precificação (congelada no momento da inscrição) ──
    @Property({ nullable: true, type: 'double' })
    valorPago?: number;

    @Property({ nullable: true })
    loteNome?: string;

    // ── Timestamps ───────────────────────────
    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Property({ default: false })
    isDeleted: boolean = false;
}
