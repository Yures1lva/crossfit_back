/**
 * Backup completo do Supabase Storage (Fase 1 do plano de migração — ver
 * mds/06-migracao-postgres-appwrite.md). Baixa todos os arquivos de todos os
 * buckets pra disco local, preservando a estrutura de pastas.
 *
 * Uso:
 *   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... \
 *     npx ts-node scripts/backup-storage.ts
 *
 * Pegue essas variáveis em: Supabase Dashboard → Project Settings → API
 * (a Service Role Key, não a anon key — precisa acessar tudo, ignorando RLS)
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_KEY antes de rodar.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outRoot = path.join(__dirname, '..', 'backups', `storage_${timestamp}`);

let totalFiles = 0;
let totalBytes = 0;
const failures: string[] = [];

async function listAllFiles(bucket: string, prefix = ''): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });
  if (error) {
    throw new Error(`Erro listando ${bucket}/${prefix}: ${error.message}`);
  }

  const files: string[] = [];
  for (const item of data ?? []) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    // heurística do SDK: entradas "pasta" não têm metadata/id
    if (item.id === null) {
      files.push(...(await listAllFiles(bucket, itemPath)));
    } else {
      files.push(itemPath);
    }
  }
  return files;
}

async function downloadFile(bucket: string, filePath: string) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error || !data) {
    failures.push(`${bucket}/${filePath}: ${error?.message ?? 'sem dados'}`);
    console.error(`  ✗ ${bucket}/${filePath} — ${error?.message}`);
    return;
  }

  const destPath = path.join(outRoot, bucket, filePath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(destPath, buffer);

  totalFiles++;
  totalBytes += buffer.length;
  console.log(`  ✔ ${bucket}/${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log(`Backup de Storage → ${outRoot}\n`);

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`Erro listando buckets: ${error.message}`);
  if (!buckets?.length) {
    console.log('Nenhum bucket encontrado.');
    return;
  }

  for (const bucket of buckets) {
    console.log(`Bucket: ${bucket.name}`);
    const files = await listAllFiles(bucket.name);
    console.log(`  ${files.length} arquivo(s) encontrado(s)`);
    for (const filePath of files) {
      await downloadFile(bucket.name, filePath);
    }
    console.log('');
  }

  console.log('─'.repeat(50));
  console.log(`Total: ${totalFiles} arquivo(s), ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Destino: ${outRoot}`);
  if (failures.length) {
    console.log(`\n⚠ ${failures.length} falha(s):`);
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exitCode = 1;
  } else {
    console.log('\n✔ Nenhuma falha. Copie essa pasta pra fora desta máquina (Drive, S3, etc.).');
  }
}

main().catch((err) => {
  console.error('Falhou:', err.message);
  process.exit(1);
});
