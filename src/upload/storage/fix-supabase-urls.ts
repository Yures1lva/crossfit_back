import { Logger } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

/**
 * Colunas que podem guardar URL absoluta do Supabase Storage. A migração pro
 * MinIO (mds/06-migracao-postgres-minio.md) só corrigiu algumas colunas
 * escalares — arrays/JSON como `fotos_atletas` ficaram apontando pro domínio
 * do Supabase, que foi desligado.
 */
const COLUNAS: Array<[tabela: string, coluna: string]> = [
    ['inscricao', 'comprovante_url'],
    ['inscricao', 'foto_atleta_url'],
    ['inscricao', 'fotos_atletas'],
    ['inscricao', 'laudo_medico_url'],
    ['inscricao', 'documento_identidade_url'],
    ['inscricao', 'termo_url'],
    ['inscricao', 'parceiros'],
    ['inscricao', 'dados_formulario'],
    ['campeonato', 'banner_url'],
    ['campeonato', 'regulamento_pdf_url'],
    ['campeonato', 'termo_uso_imagem_pdf_url'],
    ['campeonato', 'lp_config'],
];

const SUPABASE_PUBLIC = 'https://[a-z0-9]+\\.supabase\\.co/storage/v1/object/public/';

/**
 * Reescreve `https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<arq>`
 * para `${MINIO_PUBLIC_URL}/<bucket>/<arq>` — os buckets do MinIO têm o mesmo
 * nome dos do Supabase. Idempotente: só toca linhas que ainda têm o domínio antigo.
 */
export async function fixSupabaseUrls(orm: MikroORM): Promise<void> {
    const logger = new Logger('FixSupabaseUrls');
    const base = process.env.MINIO_PUBLIC_URL?.replace(/\/+$/, '');
    if (process.env.STORAGE_DRIVER !== 'minio' || !base) return;

    const conn = orm.em.getConnection();
    for (const [tabela, coluna] of COLUNAS) {
        const cast = await tipo(conn, tabela, coluna);
        if (!cast) continue;
        const res = await conn.execute(
            `update "${tabela}"
                set "${coluna}" = regexp_replace("${coluna}"::text, ?, ?, 'g')::${cast}
              where "${coluna}"::text ~ ?`,
            [SUPABASE_PUBLIC, `${base}/`, SUPABASE_PUBLIC],
            'run',
        );
        const afetadas = (res as { affectedRows?: number }).affectedRows ?? 0;
        if (afetadas > 0) logger.log(`${tabela}.${coluna}: ${afetadas} URL(s) do Supabase reescritas`);
    }
}

async function tipo(conn: ReturnType<MikroORM['em']['getConnection']>, tabela: string, coluna: string) {
    const [row] = await conn.execute<{ data_type: string }[]>(
        `select data_type from information_schema.columns where table_schema = 'public' and table_name = ? and column_name = ?`,
        [tabela, coluna],
    );
    if (!row) return null;
    return row.data_type === 'jsonb' || row.data_type === 'json' ? row.data_type : 'text';
}
