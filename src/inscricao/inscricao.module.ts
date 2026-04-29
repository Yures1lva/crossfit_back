import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InscricaoController } from './inscricao.controller';
import { InscricaoService } from './inscricao.service';
import { Inscricao } from './entities/inscricao.entity';
import { Campeonato } from '../campeonato/entities/campeonato.entity';

@Module({
    imports: [MikroOrmModule.forFeature([Inscricao, Campeonato])],
    controllers: [InscricaoController],
    providers: [InscricaoService],
    exports: [InscricaoService],
})
export class InscricaoModule { }
