import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config';

// Auth (Global)
import { AuthModule } from './auth/auth.module';

// Modules
import { UsuarioModule } from './usuario/usuario.module';
import { CampeonatoModule } from './campeonato/campeonato.module';
import { InscricaoModule } from './inscricao/inscricao.module';
import { UploadModule } from './upload/upload.module';
import { LoteModule } from './lote/lote.module';

@Module({
  imports: [
    // Core NestJS
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
    MikroOrmModule.forRoot({ ...config }),

    // Auth (Global @Global())
    AuthModule,

    // Modules
    UsuarioModule,
    CampeonatoModule,
    InscricaoModule,
    UploadModule,
    LoteModule,
  ],
})
export class AppModule { }


