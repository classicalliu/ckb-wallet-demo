import express from "express";
import { Transaction } from "../models/transaction";
import { getAccountId } from "./helpers";
let router = express.Router();

// withdraw money, provide address and capacity
router.post("/", async (req, res, _next) => {
  const address: string = req.body.address;
  const capacity: bigint = BigInt(req.body.capacity);

  const transaction = new Transaction();
  const result = await transaction.withdraw(
    getAccountId(req, res),
    address,
    capacity
  );

  res.json(result);
});

router.post("/sudt", async (req, res, _next) => {
  const address: string = req.body.address;
  const sudtAmount: bigint = BigInt(req.body.sudt_amount);
  const sudtToken: string = req.body.sudt_token;

  const transaction = new Transaction();
  const result = await transaction.withdraw(
    getAccountId(req, res),
    address,
    undefined,
    {
      sudtAmount,
      sudtToken,
    }
  );

  res.json(result);
});

export default router;
