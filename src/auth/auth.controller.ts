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
import type { Response, CookieOptions } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signin.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from './guards/auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    private isProd = process.env.NODE_ENV === 'production';

    constructor(private authService: AuthService) {}

    /** Opções de cookie — first-party seguro com domínio compartilhado (.sooacosports.com.br) */
    private cookieOpts(maxAge: number, httpOnly = true): CookieOptions {
        return {
            httpOnly,
            secure: this.isProd,
            sameSite: 'lax',
            maxAge,
            domain: this.isProd ? (process.env.COOKIE_DOMAIN || '.sooacosports.com.br') : undefined,
        };
    }

    /** Seta os 3 cookies padrão (access, refresh, role) */
    private setAuthCookies(res: Response, result: any) {
        res.cookie('access_token', result.access_token, this.cookieOpts(15 * 60 * 1000));
        res.cookie('refresh_token', result.refresh_token, this.cookieOpts(7 * 24 * 60 * 60 * 1000));
        // user_role: não-httpOnly (middleware Next.js precisa ler)
        res.cookie('user_role', result.usuario.role, this.cookieOpts(7 * 24 * 60 * 60 * 1000, false));
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(
        @Body() dto: SignInDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.signIn(dto.email, dto.password);
        this.setAuthCookies(res, result);

        // NUNCA retornar tokens no body
        return { usuario: result.usuario };
    }

    @Post('register')
    async register(
        @Body() dto: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.register(dto.nome, dto.email, dto.password, dto.cpf);
        this.setAuthCookies(res, result);
        return { usuario: result.usuario };
    }

    @UseGuards(RefreshTokenGuard)
    @Post('refresh')
    async refreshTokens(
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const userId = req.usuario.sub;
        const refreshToken =
            req.headers.authorization?.split(' ')[1] ??
            req.cookies?.refresh_token;

        const { access_token } = await this.authService.refreshTokens(
            userId,
            refreshToken,
        );

        res.cookie('access_token', access_token, this.cookieOpts(15 * 60 * 1000));
        return { access_token };
    }

    @HttpCode(200)
    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        const opts = this.cookieOpts(0);
        res.clearCookie('access_token', opts);
        res.clearCookie('refresh_token', opts);
        res.clearCookie('user_role', opts);
        return { success: true };
    }

    /** Verifica se já existe conta com este e-mail (endpoint público) */
    @HttpCode(200)
    @Post('check-account')
    async checkAccount(@Body() body: { email: string }) {
        const exists = await this.authService.accountExists(body.email);
        return { exists };
    }

    @UseGuards(AuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.usuario;
    }
}
