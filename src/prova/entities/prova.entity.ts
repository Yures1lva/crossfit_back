import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Campeonato } from '../../campeonato/entities/campeonato.entity';

export enum TipoValorProva {
    TEMPO = 'tempo',
    INTEIRO = 'inteiro',
    POSICAO_MANUAL = 'posicao_manual',
}

export enum StatusProva {
    CRIADA = 'criada',
    EM_ANDAMENTO = 'em_andamento',
    CONCLUIDA = 'concluida',
}

@Entity()
export class Prova {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuidv4();

    @ManyToOne(() => Campeonato)
    campeonato!: Campeonato;

    @Property()
    nome!: string;

    @Enum(() => TipoValorProva)
    tipoValor: TipoValorProva = TipoValorProva.TEMPO;

    /** Unidade de display para inteiro: "kg", "reps", "m", etc. */
    @Property({ nullable: true })
    unidade?: string;

    @Property({ nullable: true })
    timecap?: string;

    @Property({ nullable: true })
    videoUrl?: string;

    @Property({ nullable: true, type: 'json' })
    tarefas?: string[];

    /** Hex color para identificação visual */
    @Property({ default: '#D9DD6E' })
    cor: string = '#D9DD6E';

    @Enum(() => StatusProva)
    status: StatusProva = StatusProva.CRIADA;

    /** true = menor valor vence (tempo); false = maior valor vence (reps/kg) */
    @Property({ default: true })
    menorVence: boolean = true;

    /** Número de raias por bateria ao gerar automaticamente */
    @Property({ default: 6 })
    raiasPorBateria: number = 6;

    /** Quando true, gera uma única bateria com todos os atletas em fila */
    @Property({ default: false })
    raiaUnica: boolean = false;

    @Property({ default: 0 })
    ordem: number = 0;

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Property({ default: false })
    isDeleted: boolean = false;
}
