import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
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
