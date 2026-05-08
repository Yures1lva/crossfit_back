import { Migration } from '@mikro-orm/migrations';

export class Migration20260508125026 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "usuario" add column "telefone" varchar(255) null;`);

    this.addSql(`alter table "inscricao" add column "telefone" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "usuario" drop column "telefone";`);

    this.addSql(`alter table "inscricao" drop column "telefone";`);
  }

}
