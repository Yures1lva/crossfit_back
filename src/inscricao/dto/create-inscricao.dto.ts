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
    observacao?: string;
}
