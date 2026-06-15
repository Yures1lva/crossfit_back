import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService }    from './notificacoes.service';
import { NotificacoesCron }       from './cron/campeonato.cron';
import { Notificacao }            from './entities/notificacao.entity';
import { Campeonato }             from '../campeonato/entities/campeonato.entity';
import { Inscricao }              from '../inscricao/entities/inscricao.entity';

@Module({
    imports: [MikroOrmModule.forFeature([Notificacao, Campeonato, Inscricao])],
    controllers: [NotificacoesController],
    providers: [NotificacoesService, NotificacoesCron],
    exports: [NotificacoesService],
})
export class NotificacoesModule {}
