import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Campeonato } from '../../campeonato/entities/campeonato.entity';

@Entity()
export class Lote {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuidv4();

    @Property()
    nome!: string;

    @ManyToOne(() => Campeonato)
    campeonato!: Campeonato;

    @Property({ type: 'date' })
    dataFim!: Date;

    @Property()
    quantidadeTotal!: number;

    @Property({ default: 0 })
    quantidadeUsada: number = 0;

    /** { individual: 200, dupla: 400, trio: 600 } */
    @Property({ type: 'json' })
    valoresBase!: Record<string, number>;

    @Property({ default: true })
    ativo: boolean = true;

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Property({ default: false })
    isDeleted: boolean = false;
}
