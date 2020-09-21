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

Response
```json
{"username":"username","id":1}
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

Create a new address.

```bash
echo '{
  "accountId": 1
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X POST -d @- \
http://localhost:3000/addresses
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

And see transaction records.

```bash
echo '{
  "accountId": 1
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X GET -d @- \
http://localhost:3000/reconciliation
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
