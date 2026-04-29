import { Migration } from '@mikro-orm/migrations';

export class Migration20260429203914 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "cidade" ("id" uuid not null, "nome" varchar(255) not null, "nome_normalizado" varchar(255) not null, "created_at" timestamptz not null, constraint "cidade_pkey" primary key ("id"));`);
    this.addSql(`alter table "cidade" add constraint "cidade_nome_normalizado_unique" unique ("nome_normalizado");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "cidade" cascade;`);
  }

}
