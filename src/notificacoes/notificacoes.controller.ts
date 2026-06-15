import {
    Controller, Get, Patch, Post, Param, Query,
    UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { AuthGuard }           from '../auth/guards/auth.guard';
import { RolesGuard }          from '../auth/guards/roles.guard';
import { Roles }               from '../auth/decorators/roles.decorator';
import { WhatsappService }     from '../whatsapp/whatsapp.service';
import { NotificacoesService } from './notificacoes.service';
import { NotificacoesCron }    from './cron/campeonato.cron';

@ApiTags('Notificações')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'organizer')
@Controller('notificacoes')
export class NotificacoesController {
    constructor(
        private readonly notificacoesService: NotificacoesService,
        private readonly whatsapp: WhatsappService,
        private readonly cron: NotificacoesCron,
    ) {}

    @Get('whatsapp/status')
    @ApiOperation({ summary: 'Status da conexão WhatsApp' })
    getStatus() {
        return this.whatsapp.getStatus();
    }

    @Get('whatsapp/qr')
    @ApiOperation({ summary: 'QR code para autenticar WhatsApp (base64 PNG)' })
    getQr() {
        return this.whatsapp.getQr();
    }

    @Post('whatsapp/desconectar')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Desconecta e reseta a sessão WhatsApp' })
    desconectar() {
        return this.whatsapp.disconnect();
    }

    @Get()
    @ApiOperation({ summary: 'Lista histórico de notificações' })
    @ApiQuery({ name: 'tipo',         required: false })
    @ApiQuery({ name: 'canal',        required: false })
    @ApiQuery({ name: 'status',       required: false })
    @ApiQuery({ name: 'campeonatoId', required: false })
    @ApiQuery({ name: 'page',         required: false, type: Number })
    @ApiQuery({ name: 'limit',        required: false, type: Number })
    listar(
        @Query('tipo')         tipo?:         string,
        @Query('canal')        canal?:        string,
        @Query('status')       status?:       string,
        @Query('campeonatoId') campeonatoId?: string,
        @Query('page')         page?:         string,
        @Query('limit')        limit?:        string,
    ) {
        return this.notificacoesService.listar({ tipo, canal, status, campeonatoId, page, limit });
    }

    @Get('nao-lidas')
    @ApiOperation({ summary: 'Conta notificações não lidas' })
    contarNaoLidas() {
        return this.notificacoesService.contarNaoLidas();
    }

    @Patch(':id/lida')
    @ApiOperation({ summary: 'Marca notificação como lida' })
    marcarLida(@Param('id') id: string) {
        return this.notificacoesService.marcarLida(id);
    }

    @Post('cron/executar')
    @HttpCode(HttpStatus.OK)
    @Roles('admin')
    @ApiOperation({ summary: 'Dispara o cron de lembretes manualmente (admin)' })
    executarCron() {
        return this.cron.executarManual();
    }
}
