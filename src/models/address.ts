import { Key } from "./key";
import { blake160 as Blake160 } from "@nervosnetwork/ckb-sdk-utils";
import { Script } from "@ckb-lumos/base";
import { generateAddress, parseAddress } from "@ckb-lumos/helpers";

/**
 * NOTE: Do not save private_key directly to database in production.
 */
export interface AddressEntity {
  id?: number;
  blake160: string;
  private_key: string;
  public_key: string;
  account_id?: number;
}

export class Address {
  /**
   * genearte new AddressEntity
   */
  generate(): AddressEntity {
    const key = new Key();
    const keyPair = key.generate();
    const publicKey: string = keyPair.publicKey;
    const blake160: string = this.publicKeyToBlake160(publicKey);
    return {
      blake160,
      private_key: keyPair.privateKey,
      public_key: publicKey,
    };
  }

  /**
   * compute blake160 from public key
   *
   * @param publicKey
   */
  publicKeyToBlake160(publicKey: string): string {
    return "0x" + Blake160(publicKey, "hex");
  }

  scriptToAddress(script: Script): string {
    return generateAddress(script);
  }

  addressToScript(address: string): Script {
    return parseAddress(address);
  }
}

export default Address;
