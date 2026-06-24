import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail({}, { message: 'E-mail inválido' })
    email: string;

    @IsString()
    @Length(6, 6, { message: 'O código deve ter 6 dígitos' })
    code: string;

    @IsString()
    @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' })
    newPassword: string;
}
