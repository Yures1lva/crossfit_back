import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { startOfDay } from 'date-fns';

import { WhatsappService } from '../whatsapp/whatsapp.service';
import {
    Notificacao,
    NotificacaoCanal,
    NotificacaoStatus,
    NotificacaoTipo,
} from './entities/notificacao.entity';

interface EnviarParams {
    tipo: NotificacaoTipo | string;
    usuarioId?: string;
    campeonatoId?: string;
    inscricaoId?: string;
    titulo: string;
    corpo: string;
    phone?: string;
    metadados?: Record<string, unknown>;
}

export interface PaginaMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

@Injectable()
export class NotificacoesService {
    private readonly logger = new Logger(NotificacoesService.name);

    private readonly frontendUrl: string;

    constructor(
        @InjectRepository(Notificacao)
        private readonly repo: EntityRepository<Notificacao>,
        private readonly em: EntityManager,
        private readonly whatsapp: WhatsappService,
        private readonly config: ConfigService,
    ) {
        this.frontendUrl = this.config.get<string>('FRONTEND_URL', 'https://sooacosports.com.br');
    }

    async enviar(params: EnviarParams): Promise<void> {
        const { tipo, usuarioId, campeonatoId, inscricaoId, titulo, corpo, phone, metadados } = params;

        let status    = NotificacaoStatus.ENVIADA;
        let enviadoEm: Date | undefined = new Date();
        let erroMsg: string | undefined;

        if (phone) {
            const ok = await this.whatsapp.sendText(phone, corpo);
            if (!ok) {
                status    = NotificacaoStatus.ERRO;
                erroMsg   = 'Falha no envio WhatsApp';
                enviadoEm = undefined;
            }
        }

        try {
            const notif = this.repo.create({
                tipo,
                usuarioId,
                campeonatoId,
                inscricaoId,
                canal:     phone ? NotificacaoCanal.WHATSAPP : NotificacaoCanal.SISTEMA,
                status,
                titulo,
                corpo,
                phone,
                metadados,
                enviadoEm,
                erroMsg,
            } as any);
            this.em.persist(notif);
            await this.em.flush();
        } catch (dbErr: any) {
            this.logger.warn(`Falha ao salvar notificação: ${dbErr?.message}`);
        }
    }

    async notificarInscricaoAprovada(params: {
        inscricaoId: string;
        nomeAtleta: string;
        phone?: string;
        campeonatoNome: string;
        campeonatoId: string;
        dataInicio?: Date;
        categoria?: string;
        modalidade?: string;
    }): Promise<void> {
        const { inscricaoId, nomeAtleta, phone, campeonatoNome, campeonatoId, dataInicio, categoria, modalidade } = params;

        const linhas = [
            `✅ Olá, *${nomeAtleta}*!`,
            ``,
            `Sua inscrição no *${campeonatoNome}* foi *aprovada*! 🎉`,
        ];

        if (categoria) linhas.push(`📌 Categoria: *${categoria}*`);
        if (modalidade) linhas.push(`🏋️ Modalidade: *${modalidade}*`);
        if (dataInicio) {
            const data = dataInicio.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            linhas.push(`📅 Data do evento: *${data}*`);
        }

        linhas.push(``, `Fique atento às próximas instruções. Boa sorte! 💪`);

        await this.enviar({
            tipo: 'inscricao_aprovada',
            inscricaoId,
            campeonatoId,
            titulo: `Inscrição aprovada — ${campeonatoNome}`,
            corpo: linhas.join('\n'),
            phone,
            metadados: { campeonatoNome, categoria, modalidade },
        });
    }

    async notificarInscricaoCriada(params: {
        inscricaoId: string;
        nomeAtleta: string;
        phone?: string;
        campeonatoNome: string;
        campeonatoId: string;
        categoria?: string;
        modalidade?: string;
    }): Promise<void> {
        const { inscricaoId, nomeAtleta, phone, campeonatoNome, campeonatoId, categoria, modalidade } = params;

        const linhas = [
            `📋 Olá, *${nomeAtleta}*!`,
            ``,
            `Sua inscrição no *${campeonatoNome}* foi *recebida com sucesso*! 🎉`,
        ];

        if (categoria) linhas.push(`📌 Categoria: *${categoria}*`);
        if (modalidade) linhas.push(`🏋️ Modalidade: *${modalidade}*`);

        linhas.push(
            ``,
            `⚠️ Para ser *aprovado(a)*, envie os documentos obrigatórios pela plataforma:`,
            `👉 ${this.frontendUrl}/dashboard/inscricoes`,
            ``,
            `Qualquer dúvida, fale com os organizadores.`,
        );

        await this.enviar({
            tipo: 'inscricao_criada',
            inscricaoId,
            campeonatoId,
            titulo: `Inscrição recebida — ${campeonatoNome}`,
            corpo: linhas.join('\n'),
            phone,
            metadados: { campeonatoNome, categoria, modalidade },
        });
    }

    async notificarDocumentosPendentes(params: {
        inscricaoId: string;
        nomeAtleta: string;
        phone?: string;
        campeonatoNome: string;
        campeonatoId: string;
        docs: string[];
    }): Promise<void> {
        const { inscricaoId, nomeAtleta, phone, campeonatoNome, campeonatoId, docs } = params;

        const linhas = [
            `⚠️ Olá, *${nomeAtleta}*!`,
            ``,
            `Sua inscrição no *${campeonatoNome}* possui documentos pendentes:`,
            ...docs.map(d => `• ${d}`),
            ``,
            `Envie os documentos pela plataforma para ter sua inscrição aprovada:`,
            `👉 ${this.frontendUrl}/dashboard/inscricoes`,
            ``,
            `Qualquer dúvida, fale com os organizadores.`,
        ];

        await this.enviar({
            tipo: 'docs_pendentes',
            inscricaoId,
            campeonatoId,
            titulo: `Documentos pendentes — ${campeonatoNome}`,
            corpo: linhas.join('\n'),
            phone,
            metadados: { campeonatoNome, docs },
        });
    }

    async notificarInscricaoRejeitada(params: {
        inscricaoId: string;
        nomeAtleta: string;
        phone?: string;
        campeonatoNome: string;
        campeonatoId: string;
        motivo?: string;
    }): Promise<void> {
        const { inscricaoId, nomeAtleta, phone, campeonatoNome, campeonatoId, motivo } = params;

        const linhas = [
            `❌ Olá, *${nomeAtleta}*,`,
            ``,
            `Sua inscrição no *${campeonatoNome}* foi *rejeitada*.`,
        ];

        if (motivo) linhas.push(`📋 Motivo: ${motivo}`);
        linhas.push(``, `Entre em contato com os organizadores para mais informações.`);

        await this.enviar({
            tipo: 'inscricao_rejeitada',
            inscricaoId,
            campeonatoId,
            titulo: `Inscrição rejeitada — ${campeonatoNome}`,
            corpo: linhas.join('\n'),
            phone,
            metadados: { campeonatoNome, motivo },
        });
    }

    async notificarPagamentoConfirmado(params: {
        inscricaoId: string;
        nomeAtleta: string;
        phone?: string;
        campeonatoNome: string;
        campeonatoId: string;
        dataInicio?: Date;
    }): Promise<void> {
        const { inscricaoId, nomeAtleta, phone, campeonatoNome, campeonatoId, dataInicio } = params;

        const linhas = [
            `💰 Olá, *${nomeAtleta}*!`,
            ``,
            `Seu pagamento no *${campeonatoNome}* foi *confirmado*! ✅`,
            `Sua vaga está garantida. 🏋️`,
        ];

        if (dataInicio) {
            const data = dataInicio.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            linhas.push(``, `📅 Nos vemos em *${data}*!`);
        }

        await this.enviar({
            tipo: 'pagamento_confirmado',
            inscricaoId,
            campeonatoId,
            titulo: `Pagamento confirmado — ${campeonatoNome}`,
            corpo: linhas.join('\n'),
            phone,
            metadados: { campeonatoNome },
        });
    }

    async notificarLembreteCampeonato(params: {
        inscricaoId: string;
        nomeAtleta: string;
        phone?: string;
        campeonatoNome: string;
        campeonatoId: string;
        dataInicio: Date;
    }): Promise<void> {
        const { inscricaoId, nomeAtleta, phone, campeonatoNome, campeonatoId, dataInicio } = params;

        // Guard: não envia duplicata no mesmo dia para a mesma inscrição
        const hoje = startOfDay(new Date());
        const jaEnviou = await this.repo.count({
            inscricaoId,
            tipo: 'lembrete_campeonato',
            criadoEm: { $gte: hoje } as any,
        } as any);
        if (jaEnviou > 0) return;

        const corpo = [
            `⏰ Olá, *${nomeAtleta}*!`,
            ``,
            `Lembrete: o *${campeonatoNome}* é *amanhã*! 🏋️‍♀️`,
            ``,
            `Prepare seu equipamento, descanse bem e chegue no horário. 💪`,
            `Qualquer dúvida, fale com os organizadores.`,
        ].join('\n');

        await this.enviar({
            tipo: 'lembrete_campeonato',
            inscricaoId,
            campeonatoId,
            titulo: `Lembrete — ${campeonatoNome} é amanhã!`,
            corpo,
            phone,
            metadados: { campeonatoNome, dataInicio: dataInicio.toISOString() },
        });
    }

    async listar(params: {
        tipo?: string;
        canal?: string;
        status?: string;
        campeonatoId?: string;
        page?: string;
        limit?: string;
    }): Promise<{ data: Notificacao[]; meta: PaginaMeta }> {
        const page  = Math.max(1, Number(params.page  ?? 1));
        const limit = Math.min(100, Math.max(1, Number(params.limit ?? 20)));
        const where: any = {};

        if (params.tipo)         where.tipo         = params.tipo;
        if (params.canal)        where.canal        = params.canal;
        if (params.status)       where.status       = params.status;
        if (params.campeonatoId) where.campeonatoId = params.campeonatoId;

        const [total, items] = await Promise.all([
            this.repo.count(where),
            this.repo.findAll({
                where,
                orderBy: { criadoEm: 'DESC' },
                offset:  (page - 1) * limit,
                limit,
            }),
        ]);

        return {
            data: items,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async contarNaoLidas(): Promise<number> {
        return this.repo.count({ lida: false } as any);
    }

    async marcarLida(id: string): Promise<Notificacao> {
        const n = await this.repo.findOneOrFail(id as any);
        n.lida = true;
        await this.em.flush();
        return n;
    }
}
