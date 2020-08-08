import express from "express";
let router = express.Router();

/* GET users listing. */
router.get("/", (_req, res, _next) => {
  // res.send("respond with a resource");
  res.send({
    one: 1,
    two: 2,
    three: 3,
  });
});

export default router;
