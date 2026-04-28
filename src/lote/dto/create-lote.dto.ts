import { IsNotEmpty, IsString, IsDateString, IsNumber, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoteDto {
    @ApiProperty({ example: 'Lote 1' })
    @IsNotEmpty()
    @IsString()
    nome!: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    campeonatoId!: string;

    @ApiProperty({ example: '2026-06-01' })
    @IsNotEmpty()
    @IsDateString()
    dataFim!: string;

    @ApiProperty({ example: 100 })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    quantidadeTotal!: number;

    @ApiProperty({ example: { individual: 200, dupla: 400, trio: 600 } })
    @IsNotEmpty()
    @IsObject()
    valoresBase!: Record<string, number>;
}
