import { HexString } from "@ckb-lumos/base";
import { key } from "@ckb-lumos/hd";
import { createECDH } from "crypto";

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export class Key {
  generate(): KeyPair {
    const ecdh = createECDH(`secp256k1`);
    ecdh.generateKeys();
    const privateKey: string = "0x" + ecdh.getPrivateKey("hex");
    const publicKey: string = "0x" + ecdh.getPublicKey("hex", "compressed");

    return {
      privateKey,
      publicKey,
    };
  }

  privateKeyToPublicKey(privateKey: HexString): HexString {
    return key.privateToPublic(privateKey);
  }
}
