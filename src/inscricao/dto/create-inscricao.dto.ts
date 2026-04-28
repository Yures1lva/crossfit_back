import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInscricaoDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    campeonatoId!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    dadosFormulario?: Record<string, any>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    categoria?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tamanhoCamisa?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    modalidade?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    comprovanteUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fotoAtletaUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    observacao?: string;
}
