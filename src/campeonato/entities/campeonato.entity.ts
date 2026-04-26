import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

export enum StatusCampeonato {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ONGOING = 'ongoing',
    FINISHED = 'finished',
    CANCELLED = 'cancelled',
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
