import express from "express";
import Account from "../models/account";
import Address from "../models/address";
import { getAccountId } from "./helpers";
const router = express.Router();

router.post("/", async (req, res) => {
  const accountId: number = getAccountId(req, res);

  const account = new Account();
  const addressEntity = await account.generateNewAddress(accountId);

  const result = {
    blake160: addressEntity.blake160,
    public_key: addressEntity.public_key,
    account_id: addressEntity.account_id,
    secp_address: Address.generateSecpAddress(addressEntity.blake160),
  };

  res.json(result);
});

router.get("/", async (req, res) => {
  const accountId: number = getAccountId(req, res);

  const account = new Account();
  const addr = await account.getCurrentAddress(accountId);

  const result = {
    id: addr.id,
    blake160: addr.blake160,
    public_key: addr.public_key,
    account_id: addr.account_id,
    secp_address: addr.secp_address,
  };

  res.json(result);
});

export default router;
