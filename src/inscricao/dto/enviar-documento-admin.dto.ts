import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type TipoDocumentoInscricao = 'laudoMedico' | 'documentoIdentidade' | 'termo';

export class EnviarDocumentoAdminDto {
    @ApiProperty({ enum: ['laudoMedico', 'documentoIdentidade', 'termo'] })
    @IsIn(['laudoMedico', 'documentoIdentidade', 'termo'])
    tipo!: TipoDocumentoInscricao;

    /** Chave devolvida pelo upload */
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    url!: string;

    /** Posição do parceiro no array; ausente = documento do titular */
    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    parceiroIndex?: number;
}
