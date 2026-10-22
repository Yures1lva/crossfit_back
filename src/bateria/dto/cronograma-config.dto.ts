import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CronogramaConfigDto {
    /** Da 2ª prova em diante, remonta as baterias pela classificação a cada pontuação */
    @IsOptional()
    @IsBoolean()
    bateriasPorClassificacao?: boolean;

    /** true = líder na última bateria; false = líder na primeira */
    @IsOptional()
    @IsBoolean()
    liderNaUltimaBateria?: boolean;
}

export class OrdemProvasDto {
    /** "modalidade|categoria" */
    @IsNotEmpty()
    @IsString()
    categoriaKey!: string;

    @IsArray()
    @IsString({ each: true })
    provaIds!: string[];
}
