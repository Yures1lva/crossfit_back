import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpsertPontuacaoDto {
    @IsString()
    inscricaoId!: string;

    @IsString()
    provaId!: string;

    /** Valor numérico bruto (null para limpar pontuação) */
    @IsNumber()
    @IsOptional()
    valor?: number | null;

    /** Valor formatado para display */
    @IsString()
    @IsOptional()
    valorDisplay?: string;

    /** Posição manual (usado em posicao_manual) */
    @IsNumber()
    @IsOptional()
    posicaoManual?: number;
}
