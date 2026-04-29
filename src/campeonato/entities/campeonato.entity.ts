import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

export enum StatusCampeonato {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ONGOING = 'ongoing',
    FINISHED = 'finished',
    CANCELLED = 'cancelled',
}

/** Definição de um campo dinâmico do formulário de inscrição */
export interface CampoFormulario {
    nome: string;        // Ex: "Nome do atleta"
    tipo: 'text' | 'date' | 'select' | 'upload_image' | 'upload_document' | 'masked';
    obrigatorio: boolean;
    mascara?: string;    // Ex: "000.000.000-00" para CPF
    opcoes?: string[];   // Para selects (puxa de categorias/camisas ou custom)
    descricao?: string;  // Placeholder/help text
}

/** Configuração de uma modalidade (define qtd de atletas e categorias disponíveis) */
export interface ModalidadeConfig {
    nome: string;          // Ex: "Individual", "Dupla", "Trio"
    qtdAtletas: number;    // 1, 2, 3...
    categorias: string[];  // Ex: ["Iniciante Masculino", "RX Feminino", "Master 35+"]
}

@Entity()
export class Campeonato {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuidv4();

    @Property()
    nome!: string;

    @Property({ unique: true })
    slug!: string;

    @Property({ nullable: true, type: 'text' })
    descricao?: string;

    // ── LP Configurável ──────────────────────
    @Property({ nullable: true })
    bannerUrl?: string;

    @Property({ nullable: true, type: 'text' })
    regulamento?: string;

    @Property({ nullable: true, type: 'json' })
    lpConfig?: {
        corPrimaria?: string;
        corSecundaria?: string;
        heroTitulo?: string;
        heroSubtitulo?: string;
        infoLocal?: string;
        infoHorario?: string;
    };

    // ── Configuração do Formulário ── ────────
    @Property({ nullable: true, type: 'json' })
    modalidades?: ModalidadeConfig[];

    /** @deprecated — usar modalidades */
    @Property({ nullable: true, type: 'json' })
    categorias?: string[];

    @Property({ nullable: true, type: 'json' })
    tamanhosCamisa?: string[];

    @Property({ nullable: true, type: 'json' })
    camposFormulario?: CampoFormulario[];

    // ── Pagamento ────────────────────────────
    /** Preço por modalidade: { "Individual": 200, "Dupla": 400, "Trio": 600 } */
    @Property({ nullable: true, type: 'json' })
    precosModalidade?: Record<string, number>;

    /** Nome do lote ativo: "Lote 1", "Lote 2", etc. Editável a qualquer momento. */
    @Property({ nullable: true })
    loteNome?: string;

    /** @deprecated — usar precosModalidade */
    @Property({ nullable: true })
    valorInscricao?: number;

    @Property({ nullable: true })
    chavePix?: string;

    @Property({ nullable: true })
    whatsappNumero?: string;

    // ── Datas ────────────────────────────────
    @Property({ nullable: true, type: 'date' })
    dataInicio?: Date;

    @Property({ nullable: true, type: 'date' })
    dataFim?: Date;

    @Property({ nullable: true, type: 'date' })
    inscricaoInicio?: Date;

    @Property({ nullable: true, type: 'date' })
    inscricaoFim?: Date;

    // ── Status ───────────────────────────────
    @Enum(() => StatusCampeonato)
    status: StatusCampeonato = StatusCampeonato.DRAFT;

    @Property({ nullable: true })
    maxInscritos?: number;

    // ── Timestamps ───────────────────────────
    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Property({ default: false })
    isDeleted: boolean = false;
}
