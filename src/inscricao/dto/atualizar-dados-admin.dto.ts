import { IsOptional, IsString, IsEmail, IsObject, IsNumber, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Campos que o admin pode corrigir numa inscrição já enviada.
 *
 * Tudo é opcional: só o que vier no corpo é alterado, então a mesma rota serve pra editar
 * os dados do atleta, os dados do formulário ou só a observação interna.
 */
export class AtualizarDadosAdminDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    nomeAtleta?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail({}, { message: 'E-mail inválido' })
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    telefone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cpf?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    categoria?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tamanhoCamisa?: string;

    /** Valor pago; null limpa o campo */
    @ApiPropertyOptional()
    @IsOptional()
    @ValidateIf((_, valor) => valor !== null)
    @IsNumber()
    valorPago?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    loteNome?: string;

    /** Respostas do formulário dinâmico, no formato { pergunta: resposta } */
    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    dadosFormulario?: Record<string, any>;

    /** Comprovante anexado pelo admin (chave devolvida pelo upload) */
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    comprovanteUrl?: string;

    /** Observação interna do admin — salva sem aprovar nem rejeitar */
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    observacoesAdmin?: string;
}
