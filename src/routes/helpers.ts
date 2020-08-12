export function getAccountId(req: any): number {
  return req.user.accountId;
}
