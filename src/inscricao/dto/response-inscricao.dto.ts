export class ResponseInscricaoDto {
    id: string;
    status: string;
    paymentStatus: string;
    dadosFormulario?: Record<string, any>;
    observacao?: string;
    createdAt: Date;

    constructor(entity: any) {
        this.id = entity.id;
        this.status = entity.status;
        this.paymentStatus = entity.paymentStatus;
        this.dadosFormulario = entity.dadosFormulario;
        this.observacao = entity.observacao;
        this.createdAt = entity.createdAt;
    }
}
