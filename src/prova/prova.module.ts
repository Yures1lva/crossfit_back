import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProvaController } from './prova.controller';
import { ProvaService } from './prova.service';
import { Prova } from './entities/prova.entity';

@Module({
    imports: [MikroOrmModule.forFeature([Prova])],
    controllers: [ProvaController],
    providers: [ProvaService],
    exports: [ProvaService],
})
export class ProvaModule {}
