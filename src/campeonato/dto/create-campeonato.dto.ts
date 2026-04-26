import { IsNotEmpty, IsString, IsOptional, IsDateString, IsInt, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampeonatoDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    nome!: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    slug!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    descricao?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bannerUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    regulamento?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    lpConfig?: {
        corPrimaria?: string;
        corSecundaria?: string;
        heroTitulo?: string;
        heroSubtitulo?: string;
        infoLocal?: string;
        infoHorario?: string;
    };

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dataInicio?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dataFim?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    inscricaoInicio?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    inscricaoFim?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    maxInscritos?: number;
}
