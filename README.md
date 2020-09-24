# ckb-wallet-demo

It's a demo to show how to integrate lumos into a wallet or an exchange project.

It's just a demo, so it don't have account password, and save private key just in plaintext. **Don't imitate this in production**.

It has the following functions.

* Create a new account
* Create new receiving address of account
  * Then you can send CKB / sUDT to this address
  * Support secp256k1_blake160 / secp256k1_blake160_multisig / anyone_can_pay lock scripts and sUDT
* Withdraw your CKB / sUDT (Or send to anyone else.)
* Get your current balance
* Get your transaction reconciliation

## How to start

Start your node firstly. Set your node RPC uri to `.env`.

```bash
CHAIN_RPC_URI="http://127.0.0.1:8114"
```

Install dependences.

```bash
yarn
```

Set your own config

If you want to using in mainnet, set `LUMOS_CONFIG_NAME="LINA"` in `.env` file.

If you want to using in testnet, set `LUMOS_CONFIG_FILE="AGGRON4"` in `.env` file.

Or if you want to using in your own dev chain, create a `dev_cofig.json` like [`dev_config.json`](./dev_config.json), then set

```bash
LUMOS_CONFIG_NAME="DEV"
LUMOS_CONFIG_FILE="your config file path"
```

Run migration to create sqlite db.

```bash
yarn run knex:migrate:latest
```

Build & start server

```bash
yarn run watch
```

## APIs

### Create an account firstly.

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

### Provide an `account_id` to show this account current receiving address.

```bash
echo '{
  "account_id": 1
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X GET -d @- \
http://localhost:3000/addresses
```

Response example

```json
{
  "id": 11,
  "blake160": "0xeea7d8a395fc981b249ede798e466a744c4ab2f9",
  "public_key": "0x027348a64156544c06a98a8b86ef7cb1cbce30df2fc1d3e3e3a19c43e4a72939ca",
  "account_id": 1,
  "receiving_address": "ckt1qyqwaf7c5w2lexqmyj0du7vwge48gnz2ktusyeq0wu"
}
```

### If you want to renew your receiving adress, just provide an `account_id` and create a new one.

```bash
echo '{
  "account_id": 1
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X POST -d @- \
http://localhost:3000/addresses
```

Response example

```json
{
  "blake160": "0xeb5b99e86004e42a44712320a1e34e518c454e9b",
  "public_key": "0x02ac1fdcdefdcffa9b1932a4d5ea3babdcb37c6559d31f2dd567a0510c54ef49b1",
  "account_id": 1,
  "receiving_address": "ckt1qyqwkkueapsqfep2g3cjxg9pud89rrz9f6ds40nl8n"
}
```

### Then you can send capacity to returned address.

And you can get balance of provided account by `account_id`.

```bash
echo '{
  "account_id": 1
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

### If you want to withdraw your CKB / sUDT to your own address or send it to anyone else, just provide your `account_id`, receiving address, and capacity(in CKB) or sudt_token & sudt_amount(in sUDT) your need.

Withdraw CKB example.

```bash
echo '{
  "account_id": 1,
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

Withdraw sUDT example.

```bash
echo '{
  "account_id": 1,
  "address": "ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v",
  "sudt_token": "0x37b6185306a094b2e5343a6c7d999fd1268912a45088ffa4f8963e642c1cdf4e",
  "sudt_amount": "100"
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X POST -d @- \
http://localhost:3000/withdraw/sudt
```

Response example

```json
{
  "id": 11,
  "transaction_hash": "0xc6bcb2acda97d8b6f38a0bd10d21efcc207b2d54a66000c699898fdf11177fb7",
  "account_id": 1,
  "capacity": "14200000000",
  "sudt_amount": "100"
}
```

### Follwing APIs show how to show your transaction records or download it.

Show transaction records example.

```bash
echo '{
  "account_id": 1
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

Download transaction records example.

```bash
echo '{
  "account_id": 1
}' \
| tr -d '\n' \
| curl -H "Content-Type:application/json" -X GET -d @- -o transaction.csv \
http://localhost:3000/reconciliation/download
```
