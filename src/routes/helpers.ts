export function getAccountId(req: any, _res: any): number {
  return req.user.accountId;
}
