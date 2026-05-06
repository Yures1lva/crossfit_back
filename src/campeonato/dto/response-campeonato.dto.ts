import type { CampoFormulario, ModalidadeConfig } from '../entities/campeonato.entity';

export class ResponseCampeonatoDto {
    id: string;
    nome: string;
    slug: string;
    descricao?: string;
    bannerUrl?: string;
    regulamento?: string;
    regulamentoTipo?: string;
    regulamentoPdfUrl?: string;
    termoResponsabilidadePdfUrl?: string;
    termoUsoImagemPdfUrl?: string;
    lpConfig?: Record<string, any>;
    modalidades?: ModalidadeConfig[];
    categorias?: string[];
    tamanhosCamisa?: string[];
    camposFormulario?: CampoFormulario[];
    precosModalidade?: Record<string, number>;
    loteNome?: string;
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
        this.regulamentoTipo = entity.regulamentoTipo;
        this.regulamentoPdfUrl = entity.regulamentoPdfUrl;
        this.termoResponsabilidadePdfUrl = entity.termoResponsabilidadePdfUrl;
        this.termoUsoImagemPdfUrl = entity.termoUsoImagemPdfUrl;
        this.lpConfig = entity.lpConfig;
        this.modalidades = entity.modalidades;
        this.categorias = entity.categorias;
        this.tamanhosCamisa = entity.tamanhosCamisa;
        this.camposFormulario = entity.camposFormulario;
        this.precosModalidade = entity.precosModalidade;
        this.loteNome = entity.loteNome;
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
