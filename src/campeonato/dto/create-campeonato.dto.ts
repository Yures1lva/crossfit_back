import { IsNotEmpty, IsString, IsOptional, IsDateString, IsInt, Min, IsObject, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CampoFormulario } from '../entities/campeonato.entity';

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

    // ── Configuração do Formulário ──
    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    categorias?: string[];

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    tamanhosCamisa?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    camposFormulario?: CampoFormulario[];

    // ── Pagamento ──
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    valorInscricao?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    chavePix?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    whatsappNumero?: string;

    // ── Datas ──
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
