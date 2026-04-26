export class ResponseUsuarioDto {
    id: string;
    nome: string;
    email: string;
    role: string;
    createdAt: Date;

    constructor(usuario: any) {
        this.id = usuario.id;
        this.nome = usuario.nome;
        this.email = usuario.email;
        this.role = usuario.role;
        this.createdAt = usuario.createdAt;
    }
}
