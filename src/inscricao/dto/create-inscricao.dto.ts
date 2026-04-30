import { IsNotEmpty, IsString, IsOptional, IsObject, IsEmail, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ParceiroDto {
    @IsNotEmpty()
    @IsString()
    nome!: string;

    @IsNotEmpty()
    @IsString()
    cpf!: string;

    @IsNotEmpty()
    @IsString()
    tamanhoCamisa!: string;
}

export class CreateInscricaoDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    campeonatoId!: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    cpf!: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    nomeAtleta!: string;

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
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ParceiroDto)
    parceiros?: { nome: string; cpf: string }[];

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
    @IsArray()
    fotosAtletas?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fotoModo?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    observacao?: string;
}

