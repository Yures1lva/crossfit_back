import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InscricaoController } from './inscricao.controller';
import { InscricaoService } from './inscricao.service';
import { Inscricao } from './entities/inscricao.entity';
import { LoteModule } from '../lote/lote.module';

@Module({
    imports: [MikroOrmModule.forFeature([Inscricao]), LoteModule],
    controllers: [InscricaoController],
    providers: [InscricaoService],
    exports: [InscricaoService],
})
export class InscricaoModule { }
