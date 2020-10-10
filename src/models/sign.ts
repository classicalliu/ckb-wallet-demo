import { HexString } from "@ckb-lumos/base";
import { key } from "@ckb-lumos/hd";

export class Sign {
  private privateKey: HexString;

  constructor(privateKey: HexString) {
    this.privateKey = privateKey;
  }

  signRecoverable(message: HexString): HexString {
    return key.signRecoverable(message, this.privateKey);
  }
}
