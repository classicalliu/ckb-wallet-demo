export function getAccountId(req: any, res: any): number {
  const id = req.body.account_id;
  if (!id) {
    res.status(401).send("Please provide accountId!");
  }
  return +id;
}
