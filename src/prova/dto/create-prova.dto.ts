import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsArray, Matches } from 'class-validator';
import { TipoValorProva, StatusProva, SexoProva } from '../entities/prova.entity';

export class CreateProvaDto {
    @IsString()
    nome!: string;

    @IsEnum(TipoValorProva)
    @IsOptional()
    tipoValor?: TipoValorProva;

    @IsString()
    @IsOptional()
    unidade?: string;

    @IsString()
    @IsOptional()
    timecap?: string;

    /** "YYYY-MM-DD"; string vazia limpa o dia */
    @Matches(/^(\d{4}-\d{2}-\d{2})?$/, { message: 'dia deve estar no formato AAAA-MM-DD' })
    @IsOptional()
    dia?: string;

    @IsString()
    @IsOptional()
    horaInicio?: string;

    @IsString()
    @IsOptional()
    videoUrl?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tarefas?: string[];

    @IsString()
    @IsOptional()
    cor?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    categorias?: string[];

    @IsEnum(SexoProva)
    @IsOptional()
    sexo?: SexoProva;

    @IsEnum(StatusProva)
    @IsOptional()
    status?: StatusProva;

    @IsBoolean()
    @IsOptional()
    menorVence?: boolean;

    @IsNumber()
    @IsOptional()
    raiasPorBateria?: number;

    @IsBoolean()
    @IsOptional()
    raiaUnica?: boolean;

    @IsNumber()
    @IsOptional()
    ordem?: number;

    @IsNumber()
    @IsOptional()
    janelaContestacaoMin?: number;
}
