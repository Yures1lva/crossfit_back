import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CampeonatoController } from './campeonato.controller';
import { CampeonatoService } from './campeonato.service';
import { Campeonato } from './entities/campeonato.entity';

@Module({
    imports: [MikroOrmModule.forFeature([Campeonato])],
    controllers: [CampeonatoController],
    providers: [CampeonatoService],
    exports: [CampeonatoService],
})
export class CampeonatoModule { }
