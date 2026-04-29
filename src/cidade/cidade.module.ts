import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Cidade } from './entities/cidade.entity';
import { CidadeService } from './cidade.service';
import { CidadeController } from './cidade.controller';

@Module({
    imports: [MikroOrmModule.forFeature([Cidade])],
    controllers: [CidadeController],
    providers: [CidadeService],
    exports: [CidadeService],
})
export class CidadeModule {}
