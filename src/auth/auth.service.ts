import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from '../usuario/usuario.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usuarioService: UsuarioService,
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

    async register(nome: string, email: string, password: string) {
        const existing = await this.usuarioService.findByEmail(email);
        if (existing) {
            throw new ConflictException('E-mail já cadastrado');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await this.usuarioService.create({
            nome,
            email,
            password: hashedPassword,
        });

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
}
