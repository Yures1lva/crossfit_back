import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Usuario {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Property()
  nome!: string;

  @Property({ unique: true })
  email!: string;

  @Property({ nullable: true, index: true })
  cpf?: string;

  @Property({ nullable: true })
  telefone?: string;

  @Property()
  password!: string;

  @Property({ nullable: true })
  refreshToken?: string; // hash bcrypt do refresh token

  @Property({ nullable: true })
  resetCode?: string; // hash bcrypt do código de recuperação de senha

  @Property({ nullable: true })
  resetCodeExpiry?: Date; // expiração do código de recuperação

  @Property({ default: 'athlete' })
  role: 'admin' | 'organizer' | 'athlete' = 'athlete';

  @Property({ default: false })
  isDisabled: boolean = false;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ default: false })
  isDeleted: boolean = false;
}
