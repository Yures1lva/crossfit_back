import { Migration } from '@mikro-orm/migrations';

export class Migration20260429210006 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "inscricao" add column "comprovante_updated_at" timestamptz null, add column "comprovante_update_count" int not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "inscricao" drop column "comprovante_updated_at", drop column "comprovante_update_count";`);
  }

}
