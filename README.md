# ckb-wallet-demo

It's a demo to show how to integrate lumos into a wallet or a exchange project.

It's just a demo, so it don't have account password, and save private key just in plaintext. Don't imitate this in production.

## Usage

Run migration

```bash
yarn run knex:migrate:latest
```

Build & start server

```bash
yarn run watch
```

## APIs

create an account firstly.

```bash
echo '{
  "username": "username"
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X POST -d @- \
http://localhost:3000/accounts
```

Response example
```json
{
  "username":"username",
  "id":1
}
```

Get current address.

```bash
echo '{
  "accountId": 1
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X GET -d @- \
http://localhost:3000/addresses
```

Response example

```json
{
  "id": 10,
  "blake160": "0x7c82d4a336e439c8f32422b51fd114659215fa44",
  "public_key": "0x032a5b79e602588a0fc8be69b278b50ff65de0cc08756b2c4a6bbcfd7a3b87eee5",
  "account_id": 1,
  "secp_address": "ckt1qyq8eqk55vmwgwwg7vjz9dgl6y2xtys4lfzqlmjual"
}
```

Create a new address.

```bash
echo '{
  "accountId": 1
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X POST -d @- \
http://localhost:3000/addresses
```

Response example

```json
{
  "blake160": "0xeea7d8a395fc981b249ede798e466a744c4ab2f9",
  "public_key": "0x027348a64156544c06a98a8b86ef7cb1cbce30df2fc1d3e3e3a19c43e4a72939ca",
  "account_id": 1,
  "secp_address": "ckt1qyqwaf7c5w2lexqmyj0du7vwge48gnz2ktusyeq0wu"
}
```

Then you can send capacity to returned address.

And withdraw from wallet.

```bash
echo '{
  "accountId": 1,
  "address": "ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v",
  "capacity": "10000000000"
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X POST -d @- \
http://localhost:3000/withdraw
```

Response example

```json
{
  "id": 8,
  "transaction_hash": "0x60556acd1aa0dff9019f874f2744e94b3809af841b0674eb3c6ec1fb262623d1",
  "account_id": 1,
  "capacity": "10000000000",
  "sudt_amount": "0"
}
```

And see transaction records.

```bash
echo '{
  "accountId": 1
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X GET -d @- \
http://localhost:3000/reconciliation
```

Response example

```json
[
  {
    "transaction_hash": "0x29bdbe09cab61ede270367cadc0f802322786237eaf5b133e4717b5ceaee8b19",
    "capacity": "-10000000000",
    "sudt_amount": "0"
  },
  {
    "transaction_hash": "0xf410dc9f03572f794b1df0bccfc269c296ff2bde7f842b742913a7c67fbe0c9e",
    "capacity": 100000000000,
    "sudt_amount": "0"
  },
]
```

Or you can download this by

```bash
echo '{
  "accountId": 1
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X GET -d @- -o transaction.csv \
http://localhost:3000/reconciliation/download
```

Get balance

```bash
echo '{
  "accountId": 1
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X GET -d @- \
http://localhost:3000/accounts/balance
```

Response example

```json
{
  "capacity": "170000000000",
  "sudt_amount": "0"
}
```
