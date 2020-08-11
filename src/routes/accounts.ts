import express from "express";
import Account from "../models/account";
let router = express.Router();

router.post("/", async (req, res, _next) => {
  const account = new Account();
  const result = await account.create(req.body.username, req.body.password);
  res.send(result);
});

router.post("/login", async (req, res, _next) => {
  const account = new Account();
  const token = await account.login(req.body.username, req.body.password);

  res.send({
    token,
    auth: `Bearer ${token}`,
  });
});

export default router;
