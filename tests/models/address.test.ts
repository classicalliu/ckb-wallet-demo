import test from "ava";
import Address from "../../src/models/address";

const bob = {
  publicKey:
    "0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01",
  blake160: "0x36c329ed630d6ce750712a477543672adab57f4c",
};

test("publicKeyToBlake160", (t) => {
  const address = new Address();
  t.is(address.publicKeyToBlake160(bob.publicKey), bob.blake160);
});
