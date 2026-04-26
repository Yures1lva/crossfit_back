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
import { SignInDto } from './dto/signin.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from './guards/auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    isProd = process.env.NODE_ENV === 'production';

    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(
        @Body() dto: SignInDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.signIn(dto.email, dto.password);

        // Cookie de curta duração — acesso
        res.cookie('access_token', result.access_token, {
            httpOnly: true,
            secure: this.isProd,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutos
            domain: this.isProd ? process.env.DOMAIN : undefined,
        });

        // Cookie de longa duração — renovação
        res.cookie('refresh_token', result.refresh_token, {
            httpOnly: true,
            secure: this.isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
            domain: this.isProd ? process.env.DOMAIN : undefined,
        });

        // Cookie de role — não-httpOnly (middleware Next.js precisa ler)
        res.cookie('user_role', result.usuario.role, {
            httpOnly: false,
            secure: this.isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            domain: this.isProd ? process.env.DOMAIN : undefined,
        });

        // NUNCA retornar tokens no body
        return { usuario: result.usuario };
    }

    @Post('register')
    async register(
        @Body() dto: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.register(dto.nome, dto.email, dto.password);

        res.cookie('access_token', result.access_token, {
            httpOnly: true,
            secure: this.isProd,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
            domain: this.isProd ? process.env.DOMAIN : undefined,
        });

        res.cookie('refresh_token', result.refresh_token, {
            httpOnly: true,
            secure: this.isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            domain: this.isProd ? process.env.DOMAIN : undefined,
        });

        res.cookie('user_role', result.usuario.role, {
            httpOnly: false,
            secure: this.isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            domain: this.isProd ? process.env.DOMAIN : undefined,
        });

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

        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: this.isProd,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
        });

        return { access_token };
    }

    @HttpCode(200)
    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        const domain = this.isProd ? process.env.DOMAIN : undefined;
        res.clearCookie('access_token', { domain });
        res.clearCookie('refresh_token', { domain });
        res.clearCookie('user_role', { domain });
        return { success: true };
    }

    @UseGuards(AuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.usuario;
    }
}
