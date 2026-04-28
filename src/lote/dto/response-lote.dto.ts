import { Lote } from '../entities/lote.entity';

export class ResponseLoteDto {
    id: string;
    nome: string;
    campeonatoId: string;
    dataFim: Date;
    quantidadeTotal: number;
    quantidadeUsada: number;
    vagasRestantes: number;
    valoresBase: Record<string, number>;
    ativo: boolean;
    createdAt: Date;

    constructor(lote: Lote) {
        this.id = lote.id;
        this.nome = lote.nome;
        this.campeonatoId = lote.campeonato?.id;
        this.dataFim = lote.dataFim;
        this.quantidadeTotal = lote.quantidadeTotal;
        this.quantidadeUsada = lote.quantidadeUsada;
        this.vagasRestantes = lote.quantidadeTotal - lote.quantidadeUsada;
        this.valoresBase = lote.valoresBase;
        this.ativo = lote.ativo;
        this.createdAt = lote.createdAt;
    }
}
