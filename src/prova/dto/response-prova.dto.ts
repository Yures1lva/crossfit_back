import { Prova } from '../entities/prova.entity';

export class ResponseProvaDto {
    id: string;
    campeonatoId: string;
    nome: string;
    tipoValor: string;
    unidade?: string;
    timecap?: string;
    horaInicio?: string;
    videoUrl?: string;
    tarefas?: string[];
    cor: string;
    categorias?: string[];
    sexo: string;
    status: string;
    concluidaEm?: Date;
    janelaContestacaoMin: number;
    menorVence: boolean;
    raiasPorBateria: number;
    raiaUnica: boolean;
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
        this.horaInicio = prova.horaInicio;
        this.videoUrl = prova.videoUrl;
        this.tarefas = prova.tarefas;
        this.cor = prova.cor;
        this.categorias = prova.categorias;
        this.sexo = prova.sexo;
        this.status = prova.status;
        this.concluidaEm = prova.concluidaEm;
        this.janelaContestacaoMin = prova.janelaContestacaoMin;
        this.menorVence = prova.menorVence;
        this.raiasPorBateria = prova.raiasPorBateria;
        this.raiaUnica = prova.raiaUnica;
        this.ordem = prova.ordem;
        this.createdAt = prova.createdAt;
        this.updatedAt = prova.updatedAt;
    }
}
