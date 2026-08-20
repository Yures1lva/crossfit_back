import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContestacaoDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    provaId!: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    inscricaoId!: string;

    @ApiProperty({ example: 'A pontuação da bateria 2 não bate com o resultado no vídeo.' })
    @IsNotEmpty()
    @IsString()
    mensagem!: string;
}
