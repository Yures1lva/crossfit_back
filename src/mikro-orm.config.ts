import 'dotenv/config';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

const isRemoteDb = !['localhost', '127.0.0.1'].includes(process.env.DB_HOST || 'localhost');

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
