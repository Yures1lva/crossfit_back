import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ScheduleModule } from '@nestjs/schedule';
import config from './mikro-orm.config';

// Auth (Global)
import { AuthModule } from './auth/auth.module';

// Modules
import { UsuarioModule }       from './usuario/usuario.module';
import { CampeonatoModule }    from './campeonato/campeonato.module';
import { InscricaoModule }     from './inscricao/inscricao.module';
import { UploadModule }        from './upload/upload.module';
import { LoteModule }          from './lote/lote.module';
import { CidadeModule }        from './cidade/cidade.module';
import { WhatsappModule }      from './whatsapp/whatsapp.module';
import { NotificacoesModule }  from './notificacoes/notificacoes.module';
import { ProvaModule }         from './prova/prova.module';
import { PontuacaoModule }     from './pontuacao/pontuacao.module';
import { BateriaModule }       from './bateria/bateria.module';
import { ContestacaoModule }   from './contestacao/contestacao.module';

@Module({
  imports: [
    // Core NestJS
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // Database
    MikroOrmModule.forRoot({ ...config }),

    // Auth (Global @Global())
    AuthModule,

    // WhatsApp (Global @Global())
    WhatsappModule,

    // Modules
    UsuarioModule,
    CampeonatoModule,
    InscricaoModule,
    UploadModule,
    LoteModule,
    CidadeModule,
    NotificacoesModule,
    ProvaModule,
    PontuacaoModule,
    BateriaModule,
    ContestacaoModule,
  ],
})
export class AppModule { }


