import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Campeonato } from '../../campeonato/entities/campeonato.entity';
import { Prova } from '../../prova/entities/prova.entity';

export interface Lane {
    raia: number;
    inscricaoId: string;
    nomeAtleta: string;
    box?: string;
}

@Entity()
export class Bateria {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuidv4();

    @ManyToOne(() => Campeonato)
    campeonato!: Campeonato;

    @ManyToOne(() => Prova)
    prova!: Prova;

    /** Chave "modalidade|categoria" ex: "Individual|MASTER 40+ MASCULINO" */
    @Property()
    categoriaKey!: string;

    @Property()
    nome!: string;

    @Property({ nullable: true })
    arenaLabel?: string;

    /** Horário início ex: "08:00" */
    @Property({ nullable: true })
    horaInicio?: string;

    /** Horário fim ex: "08:20" */
    @Property({ nullable: true })
    horaFim?: string;

    @Property({ type: 'json' })
    lanes: Lane[] = [];

    @Property({ default: 0 })
    ordem: number = 0;

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Property({ default: false })
    isDeleted: boolean = false;
}
