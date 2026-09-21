import {
    Controller,
    Post,
    Get,
    Body,
    Res,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCookieService, AUTH_COOKIE } from './auth-cookie.service';
import { SignInDto } from './dto/signin.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private cookies: AuthCookieService,
    ) {}

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(
        @Body() dto: SignInDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.signIn(dto.email, dto.password);
        this.cookies.setSession(res, { ...result, role: result.usuario.role });

        // NUNCA retornar tokens no body
        return { usuario: result.usuario };
    }

    @Post('register')
    async register(
        @Body() dto: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.register(dto.nome, dto.email, dto.password, dto.cpf);
        this.cookies.setSession(res, { ...result, role: result.usuario.role });
        return { usuario: result.usuario };
    }

    @UseGuards(RefreshTokenGuard)
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refreshTokens(
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const userId = req.usuario.sub;
        const refreshToken =
            req.headers.authorization?.split(' ')[1] ??
            req.cookies?.[AUTH_COOKIE.REFRESH];

        const { access_token, usuario } = await this.authService.refreshTokens(
            userId,
            refreshToken,
        );

        this.cookies.setAccessToken(res, access_token);

        // O cliente usa isso para reidratar a sessão sem uma segunda ida ao servidor.
        return { usuario };
    }

    @HttpCode(HttpStatus.OK)
    @Post('logout')
    async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
        // Best-effort: mesmo com o access token já expirado conseguimos identificar o
        // usuário pelo refresh token e revogar a sessão no banco. Sem isso o hash
        // continuaria válido por 7 dias após o logout.
        await this.authService.revokeSession(req.cookies?.[AUTH_COOKIE.REFRESH]);
        this.cookies.clear(res);
        return { success: true };
    }

    /** Verifica se já existe conta com este e-mail (endpoint público) */
    @HttpCode(200)
    @Post('check-account')
    async checkAccount(@Body() body: { email: string }) {
        const exists = await this.authService.accountExists(body.email);
        return { exists };
    }

    /** Solicita código de recuperação de senha via WhatsApp */
    @HttpCode(200)
    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.requestPasswordReset(dto.email);
    }

    /** Redefine a senha com o código recebido no WhatsApp */
    @HttpCode(200)
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        await this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
        return { message: 'Senha redefinida com sucesso.' };
    }

    /**
     * Perfil da sessão atual. Devolve o usuário completo (e não o payload cru do JWT),
     * porque o cliente usa esta resposta para reidratar o store depois de um reload.
     */
    @UseGuards(AuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return this.authService.getSessionUser(req.usuario.sub);
    }
}
