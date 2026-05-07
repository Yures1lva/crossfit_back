import { Migration } from '@mikro-orm/migrations';

export class Migration20260507183515 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "campeonato" drop column "termo_responsabilidade_pdf_url";`);

    this.addSql(`alter table "inscricao" drop column "termo_aceito";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "campeonato" add column "termo_responsabilidade_pdf_url" varchar(255) null;`);

    this.addSql(`alter table "inscricao" add column "termo_aceito" bool not null default false;`);
  }

}
