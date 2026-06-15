import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InscricaoController } from './inscricao.controller';
import { InscricaoService } from './inscricao.service';
import { Inscricao } from './entities/inscricao.entity';
import { Campeonato } from '../campeonato/entities/campeonato.entity';
import { UploadModule } from '../upload/upload.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([Inscricao, Campeonato]),
        UploadModule,
        forwardRef(() => NotificacoesModule),
    ],
    controllers: [InscricaoController],
    providers: [InscricaoService],
    exports: [InscricaoService],
})
export class InscricaoModule { }
