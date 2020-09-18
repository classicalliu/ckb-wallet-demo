import express from "express";
import Account from "../models/account";
let router = express.Router();

router.post("/", async (req, res, _next) => {
  const account = new Account();
  const result = await account.create(req.body.username);
  res.send(result);
});

export default router;
