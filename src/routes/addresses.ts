import express from "express";
import Account from "../models/account";
import { getAccountId } from "./helpers";
const router = express.Router();

router.post("/", async (req, res) => {
  const accountId: number = getAccountId(req);

  const account = new Account();
  const addressEntity = await account.generateNewAddress(accountId);

  res.json(addressEntity);
});

router.get("/", async (req, res) => {
  const accountId: number = getAccountId(req);

  const account = new Account();
  const addressEntity = await account.getCurrentAddress(accountId);

  res.json(addressEntity);
});

export default router;
