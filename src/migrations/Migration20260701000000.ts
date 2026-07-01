import { Migration } from '@mikro-orm/migrations';

export class Migration20260701000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "prova" alter column "status" set default 'criada';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "prova" alter column "status" set default 'em_andamento';`);
  }

}
