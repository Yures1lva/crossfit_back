import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PontuacaoController } from './pontuacao.controller';
import { PontuacaoService } from './pontuacao.service';
import { Pontuacao } from './entities/pontuacao.entity';
import { Prova } from '../prova/entities/prova.entity';
import { Inscricao } from '../inscricao/entities/inscricao.entity';
import { BateriaModule } from '../bateria/bateria.module';

@Module({
    imports: [MikroOrmModule.forFeature([Pontuacao, Prova, Inscricao]), BateriaModule],
    controllers: [PontuacaoController],
    providers: [PontuacaoService],
    exports: [PontuacaoService],
})
export class PontuacaoModule {}
