import { Migration } from '@mikro-orm/migrations';

export class Migration20260430011755 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "campeonato" ("id" uuid not null, "nome" varchar(255) not null, "slug" varchar(255) not null, "descricao" text null, "banner_url" varchar(255) null, "regulamento" text null, "lp_config" jsonb null, "modalidades" jsonb null, "categorias" jsonb null, "tamanhos_camisa" jsonb null, "campos_formulario" jsonb null, "precos_modalidade" jsonb null, "lote_nome" varchar(255) null, "valor_inscricao" int null, "chave_pix" varchar(255) null, "whatsapp_numero" varchar(255) null, "data_inicio" date null, "data_fim" date null, "inscricao_inicio" date null, "inscricao_fim" date null, "status" text check ("status" in ('draft', 'published', 'ongoing', 'finished', 'cancelled')) not null default 'draft', "max_inscritos" int null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "is_deleted" boolean not null default false, constraint "campeonato_pkey" primary key ("id"));`);
    this.addSql(`alter table "campeonato" add constraint "campeonato_slug_unique" unique ("slug");`);

    this.addSql(`create table "cidade" ("id" uuid not null, "nome" varchar(255) not null, "nome_normalizado" varchar(255) not null, "created_at" timestamptz not null, constraint "cidade_pkey" primary key ("id"));`);
    this.addSql(`alter table "cidade" add constraint "cidade_nome_normalizado_unique" unique ("nome_normalizado");`);

    this.addSql(`create table "lote" ("id" uuid not null, "nome" varchar(255) not null, "campeonato_id" uuid not null, "data_fim" date not null, "quantidade_total" int not null, "quantidade_usada" int not null default 0, "valores_base" jsonb not null, "ativo" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "is_deleted" boolean not null default false, constraint "lote_pkey" primary key ("id"));`);

    this.addSql(`create table "usuario" ("id" uuid not null, "nome" varchar(255) not null, "email" varchar(255) not null, "cpf" varchar(255) null, "password" varchar(255) not null, "refresh_token" varchar(255) null, "role" varchar(255) not null default 'athlete', "is_disabled" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, "is_deleted" boolean not null default false, constraint "usuario_pkey" primary key ("id"));`);
    this.addSql(`alter table "usuario" add constraint "usuario_email_unique" unique ("email");`);
    this.addSql(`create index "usuario_cpf_index" on "usuario" ("cpf");`);

    this.addSql(`create table "inscricao" ("id" uuid not null, "usuario_id" uuid null, "campeonato_id" uuid not null, "cpf" varchar(255) not null, "email" varchar(255) not null, "nome_atleta" varchar(255) not null, "status" text check ("status" in ('pending', 'awaiting_payment', 'payment_uploaded', 'approved', 'rejected', 'cancelled')) not null default 'pending', "payment_status" text check ("payment_status" in ('pending', 'proof_sent', 'confirmed', 'rejected')) not null default 'pending', "dados_formulario" jsonb null, "categoria" varchar(255) null, "tamanho_camisa" varchar(255) null, "modalidade" varchar(255) null, "comprovante_url" varchar(255) null, "comprovante_updated_at" timestamptz null, "comprovante_update_count" int not null default 0, "foto_atleta_url" varchar(255) null, "observacao" text null, "observacoes_admin" text null, "valor_pago" double precision null, "lote_nome" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "is_deleted" boolean not null default false, constraint "inscricao_pkey" primary key ("id"));`);
    this.addSql(`create index "inscricao_cpf_index" on "inscricao" ("cpf");`);
    this.addSql(`create index "inscricao_email_index" on "inscricao" ("email");`);

    this.addSql(`alter table "lote" add constraint "lote_campeonato_id_foreign" foreign key ("campeonato_id") references "campeonato" ("id") on update cascade;`);

    this.addSql(`alter table "inscricao" add constraint "inscricao_usuario_id_foreign" foreign key ("usuario_id") references "usuario" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "inscricao" add constraint "inscricao_campeonato_id_foreign" foreign key ("campeonato_id") references "campeonato" ("id") on update cascade;`);
  }

}
