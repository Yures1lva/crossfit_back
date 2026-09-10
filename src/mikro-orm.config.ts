import 'dotenv/config';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

// DB_SSL explícito tem prioridade; sem ele, infere pelo host (compat com configs antigas).
// Necessário porque bancos containerizados na mesma rede Docker (ex: DB_HOST=postgres)
// não têm SSL configurado, mas não são "localhost" — a inferência sozinha erraria aqui.
const isRemoteDb =
    process.env.DB_SSL !== undefined
        ? process.env.DB_SSL === 'true'
        : !['localhost', '127.0.0.1'].includes(process.env.DB_HOST || 'localhost');

const config: MikroOrmModuleOptions = {
    entities: ['./dist/**/*.entity.js'],
    entitiesTs: ['./src/**/*.entity.ts'],
    migrations: {
        path: './dist/migrations',
        pathTs: './src/migrations',
        tableName: 'mikro_orm_migrations',
        snapshot: true,
    },
    driver: PostgreSqlDriver,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'crossfit_arena',
    schema: 'public',
    pool: {
        min: Number(process.env.DB_POOL_MIN || 1),
        max: Number(process.env.DB_POOL_MAX || 10),
    },
    // SSL obrigatório para conexões remotas (Supabase, Render, etc.)
    ...(isRemoteDb && {
        driverOptions: {
            connection: {
                ssl: { rejectUnauthorized: false },
            },
        },
    }),
    // Sincroniza schema automaticamente (adiciona colunas novas, não remove dados)
    schemaGenerator: {
        disableForeignKeys: false,
    },
};

export default config;
