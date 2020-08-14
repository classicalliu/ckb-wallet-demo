import ECPair from "@nervosnetwork/ckb-sdk-utils/lib/ecpair";

export class Sign {
  private keyPair: ECPair;

  constructor(privateKey: string) {
    this.keyPair = new ECPair(privateKey);
  }

  signRecoverable(message: string): string {
    return this.keyPair.signRecoverable(message);
  }
}
