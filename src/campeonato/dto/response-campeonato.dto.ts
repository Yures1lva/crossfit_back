import type { CampoFormulario } from '../entities/campeonato.entity';

export class ResponseCampeonatoDto {
    id: string;
    nome: string;
    slug: string;
    descricao?: string;
    bannerUrl?: string;
    regulamento?: string;
    lpConfig?: Record<string, any>;
    categorias?: string[];
    tamanhosCamisa?: string[];
    camposFormulario?: CampoFormulario[];
    valorInscricao?: number;
    chavePix?: string;
    whatsappNumero?: string;
    status: string;
    dataInicio?: Date;
    dataFim?: Date;
    inscricaoInicio?: Date;
    inscricaoFim?: Date;
    maxInscritos?: number;
    createdAt: Date;

    constructor(entity: any) {
        this.id = entity.id;
        this.nome = entity.nome;
        this.slug = entity.slug;
        this.descricao = entity.descricao;
        this.bannerUrl = entity.bannerUrl;
        this.regulamento = entity.regulamento;
        this.lpConfig = entity.lpConfig;
        this.categorias = entity.categorias;
        this.tamanhosCamisa = entity.tamanhosCamisa;
        this.camposFormulario = entity.camposFormulario;
        this.valorInscricao = entity.valorInscricao;
        this.chavePix = entity.chavePix;
        this.whatsappNumero = entity.whatsappNumero;
        this.status = entity.status;
        this.dataInicio = entity.dataInicio;
        this.dataFim = entity.dataFim;
        this.inscricaoInicio = entity.inscricaoInicio;
        this.inscricaoFim = entity.inscricaoFim;
        this.maxInscritos = entity.maxInscritos;
        this.createdAt = entity.createdAt;
    }
}
