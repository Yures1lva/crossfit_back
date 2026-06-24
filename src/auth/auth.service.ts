import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from '../usuario/usuario.service';
import { InscricaoService } from '../inscricao/inscricao.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usuarioService: UsuarioService,
        @Inject(forwardRef(() => InscricaoService))
        private readonly inscricaoService: InscricaoService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private readonly whatsappService: WhatsappService,
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
                cpf: usuario.cpf || '',
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

    private readonly RESET_CODE_TTL_MS   = 15 * 60 * 1000; // 15 min
    private readonly RESET_CODE_COOLDOWN_MS = 2 * 60 * 1000;  // 2 min entre reenvios

    async requestPasswordReset(email: string): Promise<{ message: string; hasPhone: boolean }> {
        const usuario = await this.usuarioService.findByEmail(email);

        if (!usuario) {
            // Não revelamos se o e-mail existe ou não
            return { message: 'Se este e-mail estiver cadastrado e possuir telefone, você receberá um código no WhatsApp.', hasPhone: false };
        }

        if (!usuario.telefone) {
            throw new BadRequestException('Sua conta não possui telefone cadastrado. Entre em contato com o administrador para recuperar o acesso.');
        }

        // Cooldown: deriva quando o código foi enviado a partir do expiry já salvo
        if (usuario.resetCode && usuario.resetCodeExpiry) {
            const sentAt = new Date(usuario.resetCodeExpiry.getTime() - this.RESET_CODE_TTL_MS);
            const cooldownEnds = new Date(sentAt.getTime() + this.RESET_CODE_COOLDOWN_MS);
            if (new Date() < cooldownEnds) {
                const retryAfterSeconds = Math.ceil((cooldownEnds.getTime() - Date.now()) / 1000);
                throw new BadRequestException(`Aguarde ${retryAfterSeconds} segundos antes de solicitar um novo código.`);
            }
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
        const hashedCode = await bcrypt.hash(code, 10);
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        await this.usuarioService.saveResetCode(usuario.id, hashedCode, expiry);

        const message = `🔐 *Recuperação de Senha*\n\nSeu código de verificação é: *${code}*\n\nEle expira em 15 minutos. Não compartilhe com ninguém.`;
        await this.whatsappService.sendText(usuario.telefone, message);

        const phoneMasked = usuario.telefone.replace(/(\d{2})\d+(\d{2})$/, '$1*****$2');
        return {
            message: `Código enviado para o WhatsApp com final ${phoneMasked}.`,
            hasPhone: true,
        };
    }

    async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
        const usuario = await this.usuarioService.findByEmail(email);

        if (!usuario || !usuario.resetCode || !usuario.resetCodeExpiry) {
            throw new BadRequestException('Código inválido ou expirado.');
        }

        if (new Date() > usuario.resetCodeExpiry) {
            await this.usuarioService.clearResetCode(usuario.id);
            throw new BadRequestException('Código expirado. Solicite um novo.');
        }

        const matches = await bcrypt.compare(code, usuario.resetCode);
        if (!matches) {
            throw new BadRequestException('Código inválido.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usuarioService.updatePassword(usuario.id, hashedPassword);
        await this.usuarioService.clearResetCode(usuario.id);
        // Invalida sessões existentes
        await this.usuarioService.updateRefreshToken(usuario.id, null);
    }
}
