import express from "express";
import { Transaction } from "../models/transaction";
import { getAccountId } from "./helpers";
let router = express.Router();

// withdraw money, provide address and capacity
router.post("/", async (req, res, _next) => {
  const address: string = req.body.address;
  const capacity: bigint = BigInt(req.body.capacity);

  const transaction = new Transaction();
  const result: number = await transaction.withdraw(
    getAccountId(req, res),
    address,
    capacity
  );

  res.json({
    id: result,
  });
});

export default router;
