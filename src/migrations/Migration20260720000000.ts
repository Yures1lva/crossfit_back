import { Migration } from '@mikro-orm/migrations';

export class Migration20260720000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "prova" add column "categorias" jsonb null;`);
    this.addSql(`alter table "prova" add column "sexo" varchar(255) not null default 'ambos';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "prova" drop column "categorias";`);
    this.addSql(`alter table "prova" drop column "sexo";`);
  }

}
