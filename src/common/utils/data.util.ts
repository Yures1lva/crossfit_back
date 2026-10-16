/**
 * Datas "só dia" (colunas `type: 'date'`: dataInicio, docsDataLimite, lote.dataFim…).
 *
 * Chegam como meia-noite UTC. Formatar/comparar no fuso de Brasília (UTC-3)
 * empurra para o dia anterior, então trabalhamos com o YYYY-MM-DD puro.
 */

const TZ_BRASIL = 'America/Sao_Paulo';

/** 'YYYY-MM-DD' de uma coluna date (Date em meia-noite UTC ou string ISO). */
export function diaDe(valor: Date | string): string {
    return typeof valor === 'string' ? valor.slice(0, 10) : valor.toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' do dia corrente (ou deslocado) em Brasília. */
export function hojeBrasil(deslocamentoDias = 0, agora: Date = new Date()): string {
    const base = new Date(agora.getTime() + deslocamentoDias * 86_400_000);
    return base.toLocaleDateString('en-CA', { timeZone: TZ_BRASIL });
}

/** 'dd/mm/aaaa' de uma coluna date. */
export function formatarDia(valor: Date | string): string {
    const [y, m, d] = diaDe(valor).split('-');
    return `${d}/${m}/${y}`;
}

/** true quando o dia já terminou em Brasília (o próprio dia ainda é válido). */
export function diaJaPassou(valor: Date | string, agora: Date = new Date()): boolean {
    return hojeBrasil(0, agora) > diaDe(valor);
}
