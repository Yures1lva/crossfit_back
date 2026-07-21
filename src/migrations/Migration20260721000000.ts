import { Migration } from '@mikro-orm/migrations';

export class Migration20260721000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "prova" add column "hora_inicio" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "prova" drop column "hora_inicio";`);
  }

}
