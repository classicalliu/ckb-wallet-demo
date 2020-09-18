import Knex from "knex";
import { defaultConnection } from "../db/connection";
import Address, { AddressEntity } from "./address";

export interface AccountEntity {
  id?: number;
  username: string;
}

export default class Account {
  private knex: Knex;

  constructor(knex: Knex = defaultConnection) {
    this.knex = knex;
  }

  async create(username: string): Promise<AccountEntity> {
    const entity: AccountEntity = {
      username: username,
    };

    const address = new Address();
    const addressEntity: AddressEntity = address.generate();
    await this.knex.transaction(async (trx) => {
      const accountIds: number[] = await trx("accounts")
        .insert(entity)
        .returning("id");
      const accountId: number = accountIds[0];
      entity.id = accountId;
      addressEntity.account_id = accountId;
      await trx("addresses").insert(addressEntity);
    });

    return entity;
  }

  async generateNewAddress(accountId: number): Promise<AddressEntity> {
    const address = new Address();
    const addressEntity: AddressEntity = address.generate();
    addressEntity.account_id = accountId;

    await this.knex("addresses").insert(addressEntity);

    return addressEntity;
  }

  async getCurrentAddress(
    accountId: number
  ): Promise<
    AddressEntity & {
      secp_address: string;
    }
  > {
    const addressEntities: AddressEntity[] = await this.knex
      .select()
      .from("addresses")
      .where({
        account_id: accountId,
      })
      .orderBy("id", "desc");
    let currentAddressEntity: AddressEntity | undefined = addressEntities[0];

    if (!currentAddressEntity) {
      currentAddressEntity = await this.generateNewAddress(accountId);
    }

    return {
      ...currentAddressEntity,
      secp_address: Address.generateSecpAddress(currentAddressEntity.blake160),
    };
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
