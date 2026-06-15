import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { startOfDay, endOfDay, addDays } from 'date-fns';

import { NotificacoesService } from '../notificacoes.service';
import { Campeonato, StatusCampeonato } from '../../campeonato/entities/campeonato.entity';
import { Inscricao, StatusInscricao } from '../../inscricao/entities/inscricao.entity';

@Injectable()
export class NotificacoesCron {
    private readonly logger = new Logger(NotificacoesCron.name);

    constructor(
        private readonly notificacoes: NotificacoesService,
        @InjectRepository(Campeonato)
        private readonly campeonatoRepo: EntityRepository<Campeonato>,
        @InjectRepository(Inscricao)
        private readonly inscricaoRepo: EntityRepository<Inscricao>,
    ) {}

    @Cron('0 8 * * *', { timeZone: 'America/Sao_Paulo' })
    async executar(): Promise<void> {
        this.logger.log('Iniciando cron de lembretes de campeonato…');
        await this.lembrarCampeonatoAmanha();
        this.logger.log('Cron de lembretes concluído.');
    }

    async executarManual(): Promise<{ ok: boolean }> {
        await this.executar();
        return { ok: true };
    }

    private async lembrarCampeonatoAmanha(): Promise<void> {
        const amanha = addDays(new Date(), 1);
        const inicio = startOfDay(amanha);
        const fim    = endOfDay(amanha);

        const campeonatos = await this.campeonatoRepo.find({
            dataInicio: { $gte: inicio, $lte: fim } as any,
            status: { $in: [StatusCampeonato.PUBLISHED, StatusCampeonato.ONGOING] } as any,
            isDeleted: false,
        } as any);

        for (const campeonato of campeonatos) {
            const inscricoes = await this.inscricaoRepo.find({
                campeonato: campeonato.id,
                status: StatusInscricao.APPROVED,
                isDeleted: false,
            } as any);

            for (const inscricao of inscricoes) {
                await this.notificacoes.notificarLembreteCampeonato({
                    inscricaoId:    inscricao.id,
                    nomeAtleta:     inscricao.nomeAtleta,
                    phone:          inscricao.telefone,
                    campeonatoNome: campeonato.nome,
                    campeonatoId:   campeonato.id,
                    dataInicio:     campeonato.dataInicio!,
                });
            }

            if (inscricoes.length) {
                this.logger.log(
                    `Lembretes enviados: ${campeonato.nome} — ${inscricoes.length} atleta(s)`,
                );
            }
        }
    }
}
