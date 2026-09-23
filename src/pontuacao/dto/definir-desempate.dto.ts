import { IsArray, IsString } from 'class-validator';

export class DefinirDesempateDto {
    /** Categoria no formato "modalidade|categoria" */
    @IsString()
    categoria!: string;

    /** inscricaoIds na ordem desejada; quem ficar de fora volta a empatar */
    @IsArray()
    @IsString({ each: true })
    ordem!: string[];
}
