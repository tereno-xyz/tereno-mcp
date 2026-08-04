# tereno-mcp

MCP server for [Tereno](https://www.tereno.xyz) on Base. Check a contract, a
transaction or a web page before you act on it, and get a verdict with the
evidence behind it, the limits of that evidence, and the block it stops being
valid at.

Three tools are free and need no wallet. The rest are paid per call with
[x402](https://x402.org) in USDC on Base, from $0.001.

## Install

Claude Desktop, Claude Code, Cursor, Cline, Windsurf and anything else that
speaks MCP over stdio:

```json
{
  "mcpServers": {
    "tereno": {
      "command": "npx",
      "args": ["-y", "tereno-mcp"]
    }
  }
}
```

Nothing else to configure. Restart the client and the free tools work.

## Free tools

| Tool | Answers |
| --- | --- |
| `tereno_catalog` | Everything Tereno can answer, the price tiers, how long each answer stays valid, and whether it is shared or private. |
| `tereno_price` | What one specific call would cost right now, and whether the answer already exists. No wallet, no commitment. |
| `tereno_receipt` | What a settled call actually charged: tier, list price, credit applied, price paid, and whether it settled on chain. |

`tereno_price` is the one worth knowing about. Deterministic answers are shared,
so an answer another agent already paid for costs less while it is still fresh:

```
cacheStatus: "hit"     someone already computed this and it is fresh — reuse price
cacheStatus: "partial" the durable half survived — only the expired part is recomputed
cacheStatus: "miss"    nothing to reuse — this call computes it, and the next asker pays less
```

## Paid tools

`contract_guard`, `contract_change`, `contract_interface`, `token_metadata`,
`chain_snapshot`, `evidence_artifact`, `web_compile`, `transaction_intent_guard`.

Calling one returns a `402` carrying the payment challenge in `error.data.paymentRequired`.
Sign it and retry with a `PAYMENT-SIGNATURE` header to get the answer. If your
agent already has an x402 wallet, that retry is the normal flow and nothing here
needs a private key.

`transaction_intent_guard` is never cached, shared or resold: an unsigned
transaction is intent, and it stays with the wallet that paid for it.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `TERENO_WALLET` | none | Base address announced before payment, so a challenge can be bound to the wallet that will settle it. Optional; every free tool works without it. |
| `TERENO_BASE_URL` | `https://www.tereno.xyz` | Point at another deployment. |
| `TERENO_TIMEOUT_MS` | `45000` | Upstream request timeout. |

No private key is ever read, stored or transmitted by this package.

## What this package is

A stdio transport in front of the hosted endpoint at
`https://www.tereno.xyz/api/mcp`. Messages are forwarded verbatim, so the tool
list, the prices and the payment challenge come from the same place an HTTP
agent sees, and this package does not need a release when a capability changes.

The one thing it translates is payment: over HTTP the challenge arrives in a
response header, and stdio has no headers, so it is folded into the JSON-RPC
error payload where a client can still reach it.

If your client supports remote MCP servers, you can skip this package and point
it at `https://www.tereno.xyz/api/mcp` directly.

## Licence

MIT
