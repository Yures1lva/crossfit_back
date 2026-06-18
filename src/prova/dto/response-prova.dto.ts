import { Prova } from '../entities/prova.entity';

export class ResponseProvaDto {
    id: string;
    campeonatoId: string;
    nome: string;
    tipoValor: string;
    unidade?: string;
    timecap?: string;
    videoUrl?: string;
    tarefas?: string[];
    cor: string;
    status: string;
    menorVence: boolean;
    ordem: number;
    createdAt: Date;
    updatedAt: Date;

    constructor(prova: Prova) {
        this.id = prova.id;
        this.campeonatoId = (prova.campeonato as any)?.id ?? (prova.campeonato as any);
        this.nome = prova.nome;
        this.tipoValor = prova.tipoValor;
        this.unidade = prova.unidade;
        this.timecap = prova.timecap;
        this.videoUrl = prova.videoUrl;
        this.tarefas = prova.tarefas;
        this.cor = prova.cor;
        this.status = prova.status;
        this.menorVence = prova.menorVence;
        this.ordem = prova.ordem;
        this.createdAt = prova.createdAt;
        this.updatedAt = prova.updatedAt;
    }
}
