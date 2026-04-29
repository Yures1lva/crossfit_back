export class ResponseUsuarioDto {
    id: string;
    nome: string;
    email: string;
    cpf?: string;
    role: string;
    isDisabled: boolean;
    createdAt: Date;

    constructor(usuario: any) {
        this.id = usuario.id;
        this.nome = usuario.nome;
        this.email = usuario.email;
        this.cpf = usuario.cpf;
        this.role = usuario.role;
        this.isDisabled = usuario.isDisabled ?? false;
        this.createdAt = usuario.createdAt;
    }
}
