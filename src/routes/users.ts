import express from "express";
import { getAccountId } from "./helpers";
let router = express.Router();

/* GET users listing. */
router.get("/", (_req, res, _next) => {
  // res.send("respond with a resource");
  res.send({
    one: 1,
    two: 2,
    three: 3,
    account_id: getAccountId(_req, res),
  });
});

export default router;
