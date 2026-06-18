import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Campeonato } from '../../campeonato/entities/campeonato.entity';
import { Prova } from '../../prova/entities/prova.entity';
import { Inscricao } from '../../inscricao/entities/inscricao.entity';

@Entity()
@Index({ properties: ['prova', 'inscricao'], options: { unique: true } })
export class Pontuacao {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuidv4();

    @ManyToOne(() => Campeonato)
    campeonato!: Campeonato;

    @ManyToOne(() => Prova)
    prova!: Prova;

    @ManyToOne(() => Inscricao)
    inscricao!: Inscricao;

    /** Valor numérico bruto: segundos para tempo, kg/reps para inteiro */
    @Property({ nullable: true, type: 'double' })
    valor?: number;

    /** Valor formatado para exibição: "6:41", "141 kg", "188 reps" */
    @Property({ nullable: true })
    valorDisplay?: string;

    /** Posição nesta prova (1º, 2º, ...) */
    @Property({ nullable: true })
    posicao?: number;

    /** Pontos computados baseados na posição */
    @Property({ nullable: true })
    pontos?: number;

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}
