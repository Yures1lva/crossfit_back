import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

/**
 * Rate-limit simples por IP — sem dependência externa.
 * Configurável por rota via metadata ou defaults.
 *
 * Default: 10 requests por minuto por IP.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
    private readonly store = new Map<string, { count: number; resetAt: number }>();
    private readonly maxRequests: number;
    private readonly windowMs: number;

    constructor(maxRequests = 10, windowMs = 60_000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const ip = request.ip || request.connection?.remoteAddress || 'unknown';
        const now = Date.now();

        const entry = this.store.get(ip);

        if (!entry || now > entry.resetAt) {
            this.store.set(ip, { count: 1, resetAt: now + this.windowMs });
            return true;
        }

        entry.count++;

        if (entry.count > this.maxRequests) {
            throw new HttpException(
                'Muitas requisições. Tente novamente em alguns minutos.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return true;
    }
}
