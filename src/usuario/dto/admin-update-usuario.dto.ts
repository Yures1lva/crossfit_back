import { IsOptional, IsString, IsEmail, IsIn, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class AdminUpdateUsuarioDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    nome?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cpf?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    telefone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsIn(['admin', 'organizer', 'athlete'])
    role?: 'admin' | 'organizer' | 'athlete';

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
    isDisabled?: boolean;

    @ApiProperty({ description: 'Senha do admin que está fazendo a alteração' })
    @IsNotEmpty({ message: 'Senha do administrador é obrigatória' })
    @IsString()
    adminPassword!: string;
}

