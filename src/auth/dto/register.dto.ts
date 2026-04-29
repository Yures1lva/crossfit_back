import { IsNotEmpty, IsString, IsEmail, MinLength, Length, Matches } from 'class-validator';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    nome!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    @Length(11, 11, { message: 'CPF deve ter exatamente 11 dígitos' })
    @Matches(/^\d{11}$/, { message: 'CPF deve conter apenas dígitos' })
    cpf!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password!: string;
}
