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
  "id": 1,
  "blake160": "0xfff9004ac13de84e9b336b782864431bcc18621f",
  "public_key": "0x03ec0da3a96ee848d957a50904e0dd1ea7921f93d7c30a9d2958f81eb5d4392cec",
  "account_id": 1,
  "receiving_address": "ckt1qyq0l7gqftqnm6zwnvekk7pgv3p3hnqcvg0svjlfgu"
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
  "blake160": "0xaf304efc8108e4fe41687898e6174b5dd4ecbe87",
  "public_key": "0x03f6838f7517dae3a4e8a53563f194447092d7448c3463d98646ec0f47c89ce299",
  "account_id": 1,
  "receiving_address": "ckt1qyq27vzwljqs3e87g9583x8xza94m48vh6rsl4yyk7"
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
  "id": 6,
  "transaction_hash": "0xf386da89f3c293220c91b2fe58d9c2fe3002ea8549bebe18f2f6b0bc5ba0873a",
  "account_id": 1,
  "capacity": "14200000000",
  "sudt_amount": "100",
  "sudt_token": "0x37b6185306a094b2e5343a6c7d999fd1268912a45088ffa4f8963e642c1cdf4e"
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
    "transaction_hash": "0x5ebe6f073648bfd7e4d7062d9b90332cabf15b8afcc430d4d7cc2d403e591812",
    "capacity": 100000000000,
    "sudt_amount": "0",
    "sudt_token": null,
    "from_addresses": "ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83",
    "to_address": "ckt1qyq27vzwljqs3e87g9583x8xza94m48vh6rsl4yyk7"
  },
  {
    "transaction_hash": "0xe0429bcf6d474cdece4a309c45c793f648363f74ed1864f1ac35f964923082e3",
    "capacity": "-10000000000",
    "sudt_amount": "0",
    "sudt_token": null,
    "from_addresses": "ckt1qyqr2wwdsr6d3262x7rm7hnlslejeypzecyq5dw9cd",
    "to_address": "ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v"
  },
  {
    "transaction_hash": "0x236fc475408de2d310832115ac3d16968372d675647aad6365364231c58af9c2",
    "capacity": 14200000000,
    "sudt_amount": "100",
    "sudt_token": "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
    "from_addresses": "ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83,ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83,ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83",
    "to_address": "ckt1qyq27vzwljqs3e87g9583x8xza94m48vh6rsl4yyk7"
  },
  {
    "transaction_hash": "0xf386da89f3c293220c91b2fe58d9c2fe3002ea8549bebe18f2f6b0bc5ba0873a",
    "capacity": "-14200000000",
    "sudt_amount": "-100",
    "sudt_token": "0x37b6185306a094b2e5343a6c7d999fd1268912a45088ffa4f8963e642c1cdf4e",
    "from_addresses": "ckt1qyqr2wwdsr6d3262x7rm7hnlslejeypzecyq5dw9cd",
    "to_address": "ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v"
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
