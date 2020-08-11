import bcrypt from "bcrypt";
import originKnex from "knex";

export interface AccountEntity {
  username: string;
  password_digest: string;
}

export default class Account {
  public static SALT_ROUNDS = 10;

  private knex: any;

  constructor(knex: any = originKnex) {
    this.knex = knex;
  }

  async create(username: string, password: string): Promise<AccountEntity> {
    const digest: string = await this.encryptPassword(password);
    const entity: AccountEntity = {
      username: username,
      password_digest: digest,
    };
    await this.knex("accounts").insert(entity);
    return entity;
  }

  private async encryptPassword(password: string): Promise<string> {
    return bcrypt.hash(password, Account.SALT_ROUNDS);
  }

  async checkPassword(
    password: string,
    encryptedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, encryptedPassword);
  }
}
