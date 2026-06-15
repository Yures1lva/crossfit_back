import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface QueueItem {
    phone: string;
    text: string;
    resolve: (ok: boolean) => void;
}

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);
    private readonly bridgeUrl: string;
    private readonly instance: string;
    private readonly enabled: boolean;

    private readonly queue: QueueItem[] = [];
    private processing = false;
    private lastSentAt = 0;

    constructor(private readonly config: ConfigService) {
        this.bridgeUrl = config.get<string>('WHATSAPP_BRIDGE_URL', 'http://localhost:8082');
        this.instance  = config.get<string>('WHATSAPP_INSTANCE', 'crossfit');
        this.enabled   = config.get<string>('WHATSAPP_ENABLED', 'false') === 'true';
    }

    async getStatus(): Promise<{ connected: boolean; url: string }> {
        try {
            const res = await fetch(`${this.bridgeUrl}/status`, { signal: AbortSignal.timeout(5_000) });
            const data = await res.json() as any;
            return { connected: data.connected, url: this.bridgeUrl };
        } catch {
            return { connected: false, url: this.bridgeUrl };
        }
    }

    async getQr(): Promise<{ qr: string | null; connected: boolean; url: string }> {
        try {
            const res = await fetch(`${this.bridgeUrl}/qr`, { signal: AbortSignal.timeout(5_000) });
            const data = await res.json() as any;
            return { qr: data.qr, connected: data.connected, url: this.bridgeUrl };
        } catch {
            return { qr: null, connected: false, url: this.bridgeUrl };
        }
    }

    async disconnect(): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch(`${this.bridgeUrl}/disconnect`, {
                method: 'POST',
                signal: AbortSignal.timeout(10_000),
            });
            return await res.json() as any;
        } catch (err: any) {
            return { ok: false, message: err?.message ?? 'Erro ao desconectar' };
        }
    }

    sendText(phone: string, text: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            this.queue.push({ phone, text, resolve });
            if (!this.processing) this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        this.processing = true;
        while (this.queue.length > 0) {
            const elapsed = Date.now() - this.lastSentAt;
            if (this.lastSentAt > 0 && elapsed < 4_000) {
                await sleep(4_000 - elapsed);
            }
            const item = this.queue.shift()!;
            const ok = await this.sendDirect(item.phone, item.text);
            item.resolve(ok);
            this.lastSentAt = Date.now();
        }
        this.processing = false;
    }

    private async sendDirect(phone: string, text: string): Promise<boolean> {
        if (!this.enabled) {
            this.logger.debug(`[WhatsApp DISABLED] → ${phone}: ${text.slice(0, 60)}…`);
            return true;
        }

        const number = this.normalizePhone(phone);
        if (!number) {
            this.logger.warn(`Número inválido: ${phone}`);
            return false;
        }

        try {
            const res = await fetch(`${this.bridgeUrl}/message/sendText/${this.instance}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, text }),
                signal: AbortSignal.timeout(15_000),
            });

            if (!res.ok) {
                const err = await res.text();
                this.logger.warn(`Bridge retornou ${res.status}: ${err.slice(0, 100)}`);
                return false;
            }

            this.logger.log(`WhatsApp enviado → ${number}`);
            return true;
        } catch (err: any) {
            this.logger.error(`Falha ao enviar WhatsApp → ${number}: ${err?.message}`);
            return false;
        }
    }

    private normalizePhone(phone: string): string | null {
        const digits = phone.replace(/\D/g, '');
        if (!digits) return null;
        if (digits.length >= 12) return digits;
        return `55${digits}`;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
