import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';

export const AUTH_COOKIE = {
    ACCESS: 'access_token',
    REFRESH: 'refresh_token',
    ROLE: 'user_role',
} as const;

const UNIT_MS: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
};

const DEFAULT_ACCESS_MS = 15 * 60 * 1000;
const DEFAULT_REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Converte a notação do `expiresIn` do JWT ("15m", "1d", "3600") em milissegundos.
 *
 * Existe para que o cookie e o token dentro dele expirem no MESMO instante. Quando os
 * dois divergem (cookie de 15min carregando um JWT de 1d, por exemplo), o navegador
 * descarta o cookie enquanto o token ainda é válido e o usuário é deslogado sem motivo.
 */
export function parseExpiresInMs(value: string | undefined, fallbackMs: number): number {
    if (!value) return fallbackMs;
    const match = /^(\d+)\s*([smhd])?$/i.exec(value.trim());
    if (!match) return fallbackMs;

    const amount = Number(match[1]);
    const unit = match[2]?.toLowerCase();
    // Sem unidade, o `expiresIn` do jsonwebtoken assume segundos.
    return unit ? amount * UNIT_MS[unit] : amount * 1000;
}

/**
 * Fonte única dos cookies de sessão. Centralizar aqui garante que gravação e remoção
 * usem exatamente os mesmos atributos — o navegador só remove um cookie quando domain,
 * path, secure e sameSite batem com os do cookie original.
 */
@Injectable()
export class AuthCookieService {
    private readonly isProd: boolean;
    private readonly accessMaxAge: number;
    private readonly refreshMaxAge: number;

    constructor(private readonly config: ConfigService) {
        this.isProd = this.config.get<string>('NODE_ENV') === 'production';
        this.accessMaxAge = parseExpiresInMs(
            this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
            DEFAULT_ACCESS_MS,
        );
        this.refreshMaxAge = parseExpiresInMs(
            this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
            DEFAULT_REFRESH_MS,
        );
    }

    /** Atributos compartilhados por todos os cookies de sessão. */
    private baseOptions(httpOnly: boolean): CookieOptions {
        const domain = this.config.get<string>('COOKIE_DOMAIN');
        return {
            httpOnly,
            secure: this.isProd,
            sameSite: 'lax',
            path: '/',
            // Em dev o cookie é host-only (localhost); em prod usa o domínio compartilhado.
            domain: this.isProd ? domain || '.sooacosports.com.br' : undefined,
        };
    }

    /** Grava os três cookies da sessão após login/registro. */
    setSession(res: Response, tokens: { access_token: string; refresh_token: string; role: string }) {
        this.setAccessToken(res, tokens.access_token);

        res.cookie(AUTH_COOKIE.REFRESH, tokens.refresh_token, {
            ...this.baseOptions(true),
            maxAge: this.refreshMaxAge,
        });

        // user_role é legível pelo JS/proxy do Next: serve só para escolher a rota de
        // destino, nunca para autorizar. A autorização real acontece nos guards.
        res.cookie(AUTH_COOKIE.ROLE, tokens.role, {
            ...this.baseOptions(false),
            maxAge: this.refreshMaxAge,
        });
    }

    /** Renova apenas o access token, preservando refresh e role. */
    setAccessToken(res: Response, accessToken: string) {
        res.cookie(AUTH_COOKIE.ACCESS, accessToken, {
            ...this.baseOptions(true),
            maxAge: this.accessMaxAge,
        });
    }

    /** Remove os três cookies. Sem os mesmos atributos o navegador ignora a remoção. */
    clear(res: Response) {
        res.clearCookie(AUTH_COOKIE.ACCESS, this.baseOptions(true));
        res.clearCookie(AUTH_COOKIE.REFRESH, this.baseOptions(true));
        res.clearCookie(AUTH_COOKIE.ROLE, this.baseOptions(false));
    }
}
