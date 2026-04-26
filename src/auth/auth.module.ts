import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { UsuarioModule } from '../usuario/usuario.module';

@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_ACCESS_SECRET'),
                signOptions: {
                    expiresIn:
                        (configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m') as any,
                },
            }),
            inject: [ConfigService],
        }),
        UsuarioModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, RefreshTokenGuard],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
