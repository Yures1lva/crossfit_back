import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { v4 } from 'uuid';

@Entity()
export class Cidade {
    @PrimaryKey({ type: 'uuid' })
    id: string = v4();

    /** Nome exibido (capitalizado): "Marabá" */
    @Property()
    nome!: string;

    /** Nome normalizado para comparação: "maraba" (lowercase, sem acentos) */
    @Property()
    @Unique()
    nomeNormalizado!: string;

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();
}

