import { IsOptional, IsString, IsEmail, MinLength, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    nome?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'Senha atual — obrigatória ao alterar senha' })
    @ValidateIf((o) => o.password)
    @IsString()
    currentPassword?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;
}
