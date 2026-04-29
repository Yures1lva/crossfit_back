import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Cidade } from './entities/cidade.entity';

@Injectable()
export class CidadeService {
    constructor(private readonly em: EntityManager) {}

    /** Remove acentos */
    private removeAccents(str: string): string {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /** Normaliza: lowercase + sem acentos + trim */
    private normalize(str: string): string {
        return this.removeAccents(str).toLowerCase().trim().replace(/\s+/g, ' ');
    }

    /** Capitaliza cada palavra */
    private capitalize(str: string): string {
        return str.trim().replace(/\s+/g, ' ')
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }

    /** Lista cidades, opcionalmente filtradas por busca */
    async list(search?: string): Promise<Cidade[]> {
        if (search && search.trim()) {
            const normalized = this.normalize(search);
            return this.em.find(
                Cidade,
                { nomeNormalizado: { $like: `%${normalized}%` } },
                { orderBy: { nome: 'ASC' }, limit: 30 },
            );
        }
        return this.em.find(Cidade, {}, { orderBy: { nome: 'ASC' }, limit: 50 });
    }

    /** Cria cidade se ainda não existir (comparação normalizada) */
    async findOrCreate(nome: string): Promise<Cidade> {
        const nomeNormalizado = this.normalize(nome);
        const existing = await this.em.findOne(Cidade, { nomeNormalizado });

        if (existing) return existing;

        const cidade = this.em.create(Cidade, {
            nome: this.capitalize(nome),
            nomeNormalizado,
            createdAt: new Date(),
        });
        await this.em.persistAndFlush(cidade);
        return cidade;
    }
}
