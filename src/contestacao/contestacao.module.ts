import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContestacaoController } from './contestacao.controller';
import { ContestacaoService } from './contestacao.service';
import { Contestacao } from './entities/contestacao.entity';
import { Campeonato } from '../campeonato/entities/campeonato.entity';
import { Prova } from '../prova/entities/prova.entity';
import { Inscricao } from '../inscricao/entities/inscricao.entity';

@Module({
    imports: [MikroOrmModule.forFeature([Contestacao, Campeonato, Prova, Inscricao])],
    controllers: [ContestacaoController],
    providers: [ContestacaoService],
    exports: [ContestacaoService],
})
export class ContestacaoModule {}
