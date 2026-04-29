import { IsNotEmpty, IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsuarioDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    nome!: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cpf?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password!: string;
}
