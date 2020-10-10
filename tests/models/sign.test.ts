import test from "ava";
import { Sign } from "../../src/models/sign";

const signInfo = {
  message: "0x95e919c41e1ae7593730097e9bb1185787b046ae9f47b4a10ff4e22f9c3e3eab",
  signature:
    "0x1e94db61cff452639cf7dd991cf0c856923dcf74af24b6f575b91479ad2c8ef40769812d1cf1fd1a15d2f6cb9ef3d91260ef27e65e1f9be399887e9a5447786301",
  privateKey:
    "0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3",
};

test("sign", (t) => {
  const sign = new Sign(signInfo.privateKey);

  const signature = sign.signRecoverable(signInfo.message);

  t.is(signature, signInfo.signature);
});
