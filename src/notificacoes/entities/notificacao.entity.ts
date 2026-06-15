import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

export enum NotificacaoCanal {
    WHATSAPP = 'whatsapp',
    SISTEMA  = 'sistema',
}

export enum NotificacaoStatus {
    ENVIADA  = 'enviada',
    ERRO     = 'erro',
    PENDENTE = 'pendente',
}

export type NotificacaoTipo =
    | 'inscricao_aprovada'
    | 'inscricao_rejeitada'
    | 'pagamento_confirmado'
    | 'lembrete_campeonato';

@Entity({ tableName: 'notificacao' })
export class Notificacao {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuidv4();

    @Property()
    tipo!: string;

    @Property({ nullable: true, type: 'uuid' })
    usuarioId?: string;

    @Property({ nullable: true, type: 'uuid' })
    campeonatoId?: string;

    @Property({ nullable: true, type: 'uuid' })
    inscricaoId?: string;

    @Enum(() => NotificacaoCanal)
    canal: NotificacaoCanal = NotificacaoCanal.SISTEMA;

    @Enum(() => NotificacaoStatus)
    status: NotificacaoStatus = NotificacaoStatus.PENDENTE;

    @Property()
    titulo!: string;

    @Property({ type: 'text' })
    corpo!: string;

    @Property({ nullable: true })
    phone?: string;

    @Property({ type: 'json', nullable: true })
    metadados?: Record<string, any>;

    @Property({ default: false })
    lida: boolean = false;

    @Property({ nullable: true })
    erroMsg?: string;

    @Property({ nullable: true })
    enviadoEm?: Date;

    @Property({ onCreate: () => new Date() })
    criadoEm: Date = new Date();
}
