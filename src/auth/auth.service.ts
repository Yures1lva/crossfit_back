import { Injectable, UnauthorizedException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from '../usuario/usuario.service';
import { InscricaoService } from '../inscricao/inscricao.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usuarioService: UsuarioService,
        @Inject(forwardRef(() => InscricaoService))
        private readonly inscricaoService: InscricaoService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async signIn(email: string, password: string) {
        const usuario = await this.usuarioService.findByEmail(email);
        if (!usuario) {
            throw new UnauthorizedException('E-mail ou senha incorretos');
        }

        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) {
            throw new UnauthorizedException('E-mail ou senha incorretos');
        }

        if (usuario.isDisabled) {
            throw new UnauthorizedException('Usuário desabilitado');
        }

        const payload = { sub: usuario.id, role: usuario.role };

        const access_token = this.jwtService.sign(payload as any);
        const refresh_token = this.jwtService.sign(payload as any, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
        });

        // Salva HASH do refresh token no banco
        const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
        await this.usuarioService.updateRefreshToken(usuario.id, hashedRefreshToken);

        // ── Vinculação automática de inscrições órfãs ──
        await this.inscricaoService.linkToUser(usuario.id, '', email);

        return {
            access_token,
            refresh_token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role,
            },
        };
    }

    async register(nome: string, email: string, password: string, cpf: string) {
        const existing = await this.usuarioService.findByEmail(email);
        if (existing) {
            throw new ConflictException('E-mail já cadastrado');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const novoUsuario = await this.usuarioService.create({
            nome,
            email,
            cpf,
            password: hashedPassword,
        });

        // ── Vinculação automática de inscrições sem conta ──
        await this.inscricaoService.linkToUser(novoUsuario.id, cpf, email);

        // Auto-login após registro (signIn vai comparar com o hash)
        return this.signIn(email, password);
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const usuario = await this.usuarioService.findOne(userId);
        if (!usuario || !usuario.refreshToken) {
            throw new UnauthorizedException('Acesso negado');
        }

        const matches = await bcrypt.compare(refreshToken, usuario.refreshToken);
        if (!matches) {
            throw new UnauthorizedException('Acesso negado');
        }

        const payload = { sub: usuario.id, role: usuario.role };
        return { access_token: this.jwtService.sign(payload as any) };
    }

    /** Verifica se já existe conta com o e-mail informado */
    async accountExists(email: string): Promise<boolean> {
        const usuario = await this.usuarioService.findByEmail(email);
        return !!usuario;
    }
}
