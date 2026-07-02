import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusContestacao } from '../entities/contestacao.entity';

export class ResolverContestacaoDto {
    @ApiProperty({ enum: [StatusContestacao.RESOLVIDA, StatusContestacao.REJEITADA] })
    @IsEnum(StatusContestacao)
    status!: StatusContestacao;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    respostaAdmin?: string;
}
