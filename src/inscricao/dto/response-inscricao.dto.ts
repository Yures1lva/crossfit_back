export class ResponseInscricaoDto {
    id: string;
    status: string;
    paymentStatus: string;
    cpf: string;
    email: string;
    nomeAtleta: string;
    dadosFormulario?: Record<string, any>;
    categoria?: string;
    modalidade?: string;
    tamanhoCamisa?: string;
    parceiros?: {
        nome: string;
        cpf: string;
        telefone?: string;
        tamanhoCamisa?: string;
        laudoMedicoUrl?: string;
        documentoIdentidadeUrl?: string;
        termoUrl?: string;
    }[];
    comprovanteUrl?: string;
    comprovanteUpdateCount?: number;
    comprovanteUpdatedAt?: Date;
    fotoAtletaUrl?: string;
    fotosAtletas?: string[];
    fotoModo?: string;
    fotosUpdatedAt?: Date;
    fotosUpdateCount?: number;
    observacao?: string;
    observacoesAdmin?: string;
    laudoMedicoUrl?: string;
    laudoMedicoUpdatedAt?: Date;
    documentoIdentidadeUrl?: string;
    documentoIdentidadeUpdatedAt?: Date;
    termoUrl?: string;
    termoUpdatedAt?: Date;
    telefone?: string;
    telefoneResolvido?: string;
    valorPago?: number;
    loteNome?: string;
    createdAt: Date;
    usuario?: { id: string; nome: string; email: string; telefone?: string };
    campeonato?: { id: string; nome: string; slug: string; whatsappNumero?: string };
    isParceiro?: boolean;
    meuParceiroIndex?: number;

    constructor(entity: any) {
        this.id = entity.id;
        this.status = entity.status;
        this.paymentStatus = entity.paymentStatus;
        this.cpf = entity.cpf;
        this.email = entity.email;
        this.telefone = entity.telefone;
        this.nomeAtleta = entity.nomeAtleta;
        this.dadosFormulario = entity.dadosFormulario;
        this.telefoneResolvido = ResponseInscricaoDto.resolvePhone(entity);
        this.categoria = entity.categoria;
        this.modalidade = entity.modalidade;
        this.tamanhoCamisa = entity.tamanhoCamisa;
        this.parceiros = entity.parceiros;
        this.comprovanteUrl = entity.comprovanteUrl;
        this.comprovanteUpdateCount = entity.comprovanteUpdateCount ?? 0;
        this.comprovanteUpdatedAt = entity.comprovanteUpdatedAt;
        this.fotoAtletaUrl = entity.fotoAtletaUrl;
        this.fotosAtletas = entity.fotosAtletas;
        this.fotoModo = entity.fotoModo;
        this.fotosUpdatedAt = entity.fotosUpdatedAt;
        this.fotosUpdateCount = entity.fotosUpdateCount ?? 0;
        this.observacao = entity.observacao;
        this.observacoesAdmin = entity.observacoesAdmin;
        this.laudoMedicoUrl = entity.laudoMedicoUrl;
        this.laudoMedicoUpdatedAt = entity.laudoMedicoUpdatedAt;
        this.documentoIdentidadeUrl = entity.documentoIdentidadeUrl;
        this.documentoIdentidadeUpdatedAt = entity.documentoIdentidadeUpdatedAt;
        this.termoUrl = entity.termoUrl;
        this.termoUpdatedAt = entity.termoUpdatedAt;
        this.valorPago = entity.valorPago;
        this.loteNome = entity.loteNome;
        this.createdAt = entity.createdAt;
        this.isParceiro = !!entity.isParceiro;
        this.meuParceiroIndex = entity.meuParceiroIndex;

        if (entity.usuario?.id) {
            this.usuario = {
                id: entity.usuario.id,
                nome: entity.usuario.nome,
                email: entity.usuario.email,
                telefone: entity.usuario.telefone,
            };
        }

        if (entity.campeonato?.id) {
            this.campeonato = {
                id: entity.campeonato.id,
                nome: entity.campeonato.nome,
                slug: entity.campeonato.slug,
                whatsappNumero: entity.campeonato.whatsappNumero,
            };
        }
    }

    static resolvePhone(entity: any): string | undefined {
        if (entity.telefone) return entity.telefone;
        if (entity.dadosFormulario) {
            const key = Object.keys(entity.dadosFormulario).find((k: string) =>
                /telefone|celular|phone|fone/i.test(k),
            );
            if (key) return String(entity.dadosFormulario[key]);
        }
        if (entity.usuario?.telefone) return entity.usuario.telefone;
        return undefined;
    }

    static resolveCidade(entity: any): string | undefined {
        if (entity.dadosFormulario) {
            const key = Object.keys(entity.dadosFormulario).find((k: string) =>
                /cidade|city/i.test(k),
            );
            if (key) return String(entity.dadosFormulario[key]);
        }
        return undefined;
    }
}

