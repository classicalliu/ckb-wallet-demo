import express from "express";
import { Transaction } from "../models/transaction";
import { getAccountId } from "./helpers";
let router = express.Router();

router.get("/", async (req, res, _next) => {
  const transaction = new Transaction();
  const records = await transaction.getTransactions(getAccountId(req, res));

  res.json(records);
});

router.get("/download", async (req, res, _next) => {
  const transaction = new Transaction();
  const csv = await transaction.downloadCsv(getAccountId(req, res));

  res.header("Content-Type", "text/csv");
  res.attachment("transactions.csv");

  res.send(csv);
});

export default router;
