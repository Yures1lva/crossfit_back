import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';

class LaneDto {
    @IsNumber()
    raia!: number;

    @IsString()
    inscricaoId!: string;

    @IsString()
    nomeAtleta!: string;

    @IsString()
    @IsOptional()
    box?: string;
}

export class CreateBateriaDto {
    @IsString()
    provaId!: string;

    @IsString()
    categoriaKey!: string;

    @IsString()
    nome!: string;

    @IsString()
    @IsOptional()
    arenaLabel?: string;

    /** "YYYY-MM-DD"; string vazia limpa o dia */
    @Matches(/^(\d{4}-\d{2}-\d{2})?$/, { message: 'dia deve estar no formato AAAA-MM-DD' })
    @IsOptional()
    dia?: string;

    @IsString()
    @IsOptional()
    horaInicio?: string;

    @IsString()
    @IsOptional()
    horaFim?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LaneDto)
    @IsOptional()
    lanes?: LaneDto[];

    @IsNumber()
    @IsOptional()
    ordem?: number;
}
