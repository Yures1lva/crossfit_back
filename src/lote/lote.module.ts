import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { LoteController } from './lote.controller';
import { LoteService } from './lote.service';
import { Lote } from './entities/lote.entity';

@Module({
    imports: [MikroOrmModule.forFeature([Lote])],
    controllers: [LoteController],
    providers: [LoteService],
    exports: [LoteService],
})
export class LoteModule { }
