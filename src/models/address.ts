import { Key } from "./key";
import { key } from "@ckb-lumos/hd";
import { Script } from "@ckb-lumos/base";
import { generateAddress, parseAddress } from "@ckb-lumos/helpers";
import { getConfig } from "@ckb-lumos/config-manager";

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
    return key.publicKeyToBlake160(publicKey);
  }

  scriptToAddress(script: Script): string {
    return generateAddress(script);
  }

  addressToScript(address: string): Script {
    return parseAddress(address);
  }

  static generateSecpScript(args: string): Script {
    const secpTempalte = getConfig().SCRIPTS.SECP256K1_BLAKE160!;

    const script: Script = {
      code_hash: secpTempalte.CODE_HASH,
      hash_type: secpTempalte.HASH_TYPE,
      args,
    };

    return script;
  }

  static generateMultisigScript(args: string): Script {
    const multisigTemplate = getConfig().SCRIPTS.SECP256K1_BLAKE160_MULTISIG!;
    const script: Script = {
      code_hash: multisigTemplate.CODE_HASH,
      hash_type: multisigTemplate.HASH_TYPE,
      args,
    };

    return script;
  }

  static generateAcpScript(args: string): Script {
    const template = getConfig().SCRIPTS.ANYONE_CAN_PAY!;
    const script: Script = {
      code_hash: template.CODE_HASH,
      hash_type: template.HASH_TYPE,
      args,
    };
    return script;
  }

  static isAcpScript(script: Script): boolean {
    const template = getConfig().SCRIPTS.ANYONE_CAN_PAY!;
    return (
      script.code_hash === template.CODE_HASH &&
      script.hash_type === template.HASH_TYPE
    );
  }

  static isAcpAddress(address: string): boolean {
    const script = parseAddress(address);
    return this.isAcpScript(script);
  }

  static generateSecpAddress(args: string): string {
    return generateAddress(this.generateSecpScript(args));
  }

  static generateMultisigAddress(args: string): string {
    return generateAddress(this.generateMultisigScript(args));
  }

  static generateAcpAddress(args: string): string {
    return generateAddress(this.generateAcpScript(args));
  }

  static generateAllAddresses(args: string): string[] {
    return [
      this.generateSecpAddress(args),
      this.generateMultisigAddress(args),
      this.generateAcpAddress(args),
    ];
  }
}

export default Address;
