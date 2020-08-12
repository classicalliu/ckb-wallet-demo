import test from "ava";

import { Key, KeyPair } from "../../src/models/key";

const bobKeyPair: KeyPair = {
  privateKey:
    "0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3",
  publicKey:
    "0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01",
};

test("generate", (t) => {
  const key = new Key();
  const keyPair: KeyPair = key.generate();
  t.true(keyPair.privateKey.startsWith("0x"));
  t.true(keyPair.publicKey.startsWith("0x"));
});

test("privateKeyToPublicKey", (t) => {
  const key = new Key();
  const publicKey = key.privateKeyToPublicKey(bobKeyPair.privateKey);

  t.is(publicKey, bobKeyPair.publicKey);
});
