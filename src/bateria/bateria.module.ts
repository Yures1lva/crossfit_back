import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BateriaController } from './bateria.controller';
import { BateriaService } from './bateria.service';
import { Bateria } from './entities/bateria.entity';
import { Inscricao } from '../inscricao/entities/inscricao.entity';

@Module({
    imports: [MikroOrmModule.forFeature([Bateria, Inscricao])],
    controllers: [BateriaController],
    providers: [BateriaService],
    exports: [BateriaService],
})
export class BateriaModule {}
