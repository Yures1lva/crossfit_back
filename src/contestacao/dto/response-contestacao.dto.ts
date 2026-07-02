import { Contestacao, StatusContestacao } from '../entities/contestacao.entity';

export class ResponseContestacaoDto {
    id: string;
    campeonatoId: string;
    provaId: string;
    provaNome: string;
    inscricaoId: string;
    nomeAtleta: string;
    categoria?: string;
    modalidade?: string;
    mensagem: string;
    status: StatusContestacao;
    respostaAdmin?: string;
    createdAt: Date;
    resolvidoEm?: Date;

    constructor(c: Contestacao) {
        this.id = c.id;
        this.campeonatoId = c.campeonato?.id;
        this.provaId = c.prova?.id;
        this.provaNome = c.prova?.nome;
        this.inscricaoId = c.inscricao?.id;
        this.nomeAtleta = c.inscricao?.nomeAtleta;
        this.categoria = c.inscricao?.categoria;
        this.modalidade = c.inscricao?.modalidade;
        this.mensagem = c.mensagem;
        this.status = c.status;
        this.respostaAdmin = c.respostaAdmin;
        this.createdAt = c.createdAt;
        this.resolvidoEm = c.resolvidoEm;
    }
}
