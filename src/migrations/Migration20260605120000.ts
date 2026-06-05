import { Migration } from '@mikro-orm/migrations';

export class Migration20260605120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "campeonato" add column "pix_descricao" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "campeonato" drop column "pix_descricao";`);
  }

}
