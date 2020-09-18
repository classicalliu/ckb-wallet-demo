import express from "express";
import Account from "../models/account";
import { Transaction } from "../models/transaction";
import { getAccountId } from "./helpers";
let router = express.Router();

router.post("/", async (req, res, _next) => {
  const account = new Account();
  const result = await account.create(req.body.username);
  res.send(result);
});

router.get("/balance", async (req, res, _next) => {
  const accountId = getAccountId(req, res);
  const result = await new Transaction().getBalance(accountId);

  res.json(result);
});

export default router;
