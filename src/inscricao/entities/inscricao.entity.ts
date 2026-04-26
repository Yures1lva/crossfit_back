import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
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

    @ManyToOne(() => Usuario)
    usuario!: Usuario;

    @ManyToOne(() => Campeonato)
    campeonato!: Campeonato;

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

    // ── Uploads ──────────────────────────────
    @Property({ nullable: true })
    comprovanteUrl?: string;

    @Property({ nullable: true })
    fotoAtletaUrl?: string;

    // ── Admin ────────────────────────────────
    @Property({ nullable: true, type: 'text' })
    observacao?: string;

    @Property({ nullable: true, type: 'text' })
    observacoesAdmin?: string;

    // ── Timestamps ───────────────────────────
    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Property({ default: false })
    isDeleted: boolean = false;
}
