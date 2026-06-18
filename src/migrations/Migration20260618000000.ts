import { Migration } from '@mikro-orm/migrations';

export class Migration20260618000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      create table "prova" (
        "id" uuid not null default gen_random_uuid(),
        "campeonato_id" uuid not null,
        "nome" varchar(255) not null,
        "tipo_valor" varchar(255) not null default 'tempo',
        "unidade" varchar(255) null,
        "timecap" varchar(255) null,
        "video_url" varchar(255) null,
        "tarefas" jsonb null,
        "cor" varchar(255) not null default '#D9DD6E',
        "status" varchar(255) not null default 'em_andamento',
        "menor_vence" boolean not null default true,
        "ordem" int not null default 0,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        "is_deleted" boolean not null default false,
        constraint "prova_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      alter table "prova"
        add constraint "prova_campeonato_id_foreign"
        foreign key ("campeonato_id")
        references "campeonato" ("id")
        on update cascade;
    `);

    this.addSql(`
      create table "pontuacao" (
        "id" uuid not null default gen_random_uuid(),
        "campeonato_id" uuid not null,
        "prova_id" uuid not null,
        "inscricao_id" uuid not null,
        "valor" double precision null,
        "valor_display" varchar(255) null,
        "posicao" int null,
        "pontos" int null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "pontuacao_pkey" primary key ("id"),
        constraint "pontuacao_prova_inscricao_unique" unique ("prova_id", "inscricao_id")
      );
    `);

    this.addSql(`
      alter table "pontuacao"
        add constraint "pontuacao_campeonato_id_foreign"
        foreign key ("campeonato_id") references "campeonato" ("id") on update cascade,
        add constraint "pontuacao_prova_id_foreign"
        foreign key ("prova_id") references "prova" ("id") on update cascade,
        add constraint "pontuacao_inscricao_id_foreign"
        foreign key ("inscricao_id") references "inscricao" ("id") on update cascade;
    `);

    this.addSql(`
      create table "bateria" (
        "id" uuid not null default gen_random_uuid(),
        "campeonato_id" uuid not null,
        "prova_id" uuid not null,
        "categoria_key" varchar(255) not null,
        "nome" varchar(255) not null,
        "arena_label" varchar(255) null,
        "hora_inicio" varchar(255) null,
        "hora_fim" varchar(255) null,
        "lanes" jsonb not null default '[]',
        "ordem" int not null default 0,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        "is_deleted" boolean not null default false,
        constraint "bateria_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      alter table "bateria"
        add constraint "bateria_campeonato_id_foreign"
        foreign key ("campeonato_id") references "campeonato" ("id") on update cascade,
        add constraint "bateria_prova_id_foreign"
        foreign key ("prova_id") references "prova" ("id") on update cascade;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "bateria" cascade;`);
    this.addSql(`drop table if exists "pontuacao" cascade;`);
    this.addSql(`drop table if exists "prova" cascade;`);
  }

}
