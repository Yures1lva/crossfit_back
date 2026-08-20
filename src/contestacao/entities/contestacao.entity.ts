import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Campeonato } from '../../campeonato/entities/campeonato.entity';
import { Prova } from '../../prova/entities/prova.entity';
import { Inscricao } from '../../inscricao/entities/inscricao.entity';

export enum StatusContestacao {
    PENDENTE = 'pendente',
    RESOLVIDA = 'resolvida',
    REJEITADA = 'rejeitada',
}

@Entity()
export class Contestacao {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuidv4();

    @ManyToOne(() => Campeonato)
    campeonato!: Campeonato;

    @ManyToOne(() => Prova)
    prova!: Prova;

    @ManyToOne(() => Inscricao)
    inscricao!: Inscricao;

    @Property({ type: 'text' })
    mensagem!: string;

    @Enum(() => StatusContestacao)
    status: StatusContestacao = StatusContestacao.PENDENTE;

    @Property({ type: 'text', nullable: true })
    respostaAdmin?: string;

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ nullable: true })
    resolvidoEm?: Date;
}
