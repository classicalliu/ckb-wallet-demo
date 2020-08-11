import bcrypt from "bcrypt";
import Knex from "knex";
import jsonWebToken from "jsonwebtoken";
import { defaultConnection } from "../db/connection";

// TODO: update this
export const JWT_SECRET_KEY = "secret";

export interface AccountEntity {
  id?: number;
  username: string;
  password_digest: string;
}

export default class Account {
  public static SALT_ROUNDS = 10;

  private knex: Knex;

  constructor(knex: Knex = defaultConnection) {
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

  async login(username: string, password: string): Promise<string> {
    const accountEntity: AccountEntity = await this.get(username);

    await this.verify(password, accountEntity.password_digest);

    return jsonWebToken.sign(
      {
        accountId: accountEntity.id!,
      },
      JWT_SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
  }

  async verifyJWT(token: string): Promise<AccountEntity | undefined> {
    const result = jsonWebToken.verify(token, JWT_SECRET_KEY);
    const accountId: number = (result as any).accountId!;

    const accountEntities: AccountEntity[] = await this.knex
      .select()
      .from("accounts")
      .where({
        id: accountId,
      })
      .limit(1);

    if (accountEntities.length === 0) {
      throw new Error("JWT not exits!");
    }

    const accountEntity: AccountEntity | undefined = accountEntities[0];

    return accountEntity;
  }

  async verify(password: string, digest: string): Promise<void> {
    const result = await this.checkPassword(password, digest);

    if (!result) {
      throw new Error(`Password not right!`);
    }
  }

  async get(username: string): Promise<AccountEntity> {
    const ae = await this.knex
      .select()
      .from("accounts")
      .where({
        username,
      })
      .limit(1);

    // TODO: if ae.length === 0

    return ae[0];
  }
}
