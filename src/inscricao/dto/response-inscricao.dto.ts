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
    comprovanteUrl?: string;
    fotoAtletaUrl?: string;
    observacao?: string;
    observacoesAdmin?: string;
    valorPago?: number;
    loteNome?: string;
    createdAt: Date;
    usuario?: { id: string; nome: string; email: string };
    campeonato?: { id: string; nome: string; slug: string; whatsappNumero?: string };

    constructor(entity: any) {
        this.id = entity.id;
        this.status = entity.status;
        this.paymentStatus = entity.paymentStatus;
        this.cpf = entity.cpf;
        this.email = entity.email;
        this.nomeAtleta = entity.nomeAtleta;
        this.dadosFormulario = entity.dadosFormulario;
        this.categoria = entity.categoria;
        this.modalidade = entity.modalidade;
        this.tamanhoCamisa = entity.tamanhoCamisa;
        this.comprovanteUrl = entity.comprovanteUrl;
        this.fotoAtletaUrl = entity.fotoAtletaUrl;
        this.observacao = entity.observacao;
        this.observacoesAdmin = entity.observacoesAdmin;
        this.valorPago = entity.valorPago;
        this.loteNome = entity.loteNome;
        this.createdAt = entity.createdAt;

        if (entity.usuario?.id) {
            this.usuario = {
                id: entity.usuario.id,
                nome: entity.usuario.nome,
                email: entity.usuario.email,
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
}
