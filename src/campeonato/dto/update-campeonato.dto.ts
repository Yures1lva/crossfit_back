import { PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCampeonatoDto } from './create-campeonato.dto';

export class RenomearCategoriaDto {
    /** Modalidade da categoria; vazio aplica em todas */
    @IsOptional()
    @IsString()
    modalidade?: string;

    @IsString()
    de!: string;

    @IsString()
    para!: string;
}

export class UpdateCampeonatoDto extends PartialType(CreateCampeonatoDto) {
    /**
     * Categorias renomeadas nesta edição. Não é campo do campeonato: é uma instrução para
     * propagar o nome novo em quem já usa o antigo (inscrições, provas e baterias).
     */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RenomearCategoriaDto)
    renomearCategorias?: RenomearCategoriaDto[];
}
