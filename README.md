<div align="center">

<img src="images/logo.png" alt="Tereno" width="150" />

# tereno-mcp

### 🛡️ Check before you act — an MCP server for Base, over x402

**Ask what it costs before you pay for it.** Free catalog, pricing and receipt
tools work with no wallet and no signup; paid answers settle per call in USDC,
and reusing an answer another agent already paid for costs less.

<br/>

[![npm version](https://img.shields.io/npm/v/tereno-mcp?style=for-the-badge&color=0052FF&logo=npm)](https://www.npmjs.com/package/tereno-mcp)
[![MCP](https://img.shields.io/badge/MCP-registry-8B5CF6?style=for-the-badge)](https://registry.modelcontextprotocol.io)
[![Base](https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)](https://base.org)
[![x402](https://img.shields.io/badge/x402%20%C2%B7%20USDC-2775CA?style=for-the-badge)](https://www.x402.org)

[![license](https://img.shields.io/npm/l/tereno-mcp?style=flat-square&color=green)](./LICENSE)
[![no dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat-square)](./package.json)
[![free tier](https://img.shields.io/badge/free%20tools-no%20wallet-success?style=flat-square)](#-free-no-wallet-needed)

```bash
npx -y tereno-mcp
```

</div>

---

## ⚡ Why this exists

An agent that reads a contract, signs a transaction or scrapes a page is acting
on information it cannot verify. Most tools answer *what* something is. None of
them tell you how long that answer stays true.

`tereno-mcp` puts [Tereno](https://www.tereno.xyz) inside any MCP client. Every
paid answer comes back with the evidence behind it, the limits of that evidence,
and **the block it stops being valid at**.

- **No API key, no signup.** The agent's wallet *is* the identity.
- **Price before payment.** `tereno_price` tells you the cost and whether the
  answer already exists, without a wallet and without committing to anything.
- **Cheaper when shared.** Deterministic answers are reused across agents: the
  first caller pays to compute, everyone after pays the reuse price.

## 🚀 Install

Add it to any MCP client — Claude Desktop, Claude Code, Cursor, Cline, Windsurf:

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

Restart the client. Nothing else to configure — the free tools work immediately.

## 🆓 Free, no wallet needed

| Tool | The question it answers |
|---|---|
| 📖 `tereno_catalog` | What can Tereno answer, what does it cost, how long does each answer stay valid? |
| 🏷️ `tereno_price` | What would *this exact call* cost right now — and does the answer already exist? |
| 🧾 `tereno_receipt` | What did a settled call actually charge: tier, list price, credit applied, price paid? |

`tereno_price` is the one worth knowing about. It names the reuse tier out loud:

```
hit      another agent already paid to compute this and it is still fresh
partial  the durable half survived; only the expired part is recomputed
miss     nothing to reuse — this call computes it, and the next asker pays less
```

## 💳 Paid per call

| Tool | Price | The question it answers |
|---|---:|---|
| 🚦 `transaction_intent_guard` | $0.005 | **Is this safe to sign?** Simulation, gas, balance and allowance deltas, unlimited-approval flags |
| 🛡️ `contract_guard` | $0.001–3 | Is this contract safe to interact with? (code, proxy, pause) |
| 🕵️ `contract_change` | $0.001–2 | Did it change since last look? (rug-pull-after-audit detector) |
| 🪙 `token_metadata` | $0.001–3 | What token is this, really? (name, symbol, decimals, supply) |
| 🧬 `contract_interface` | $0.001–2 | ERC-20? NFT? Proxy? One bounded probe |
| ⛽ `chain_snapshot` | $0.001–2 | Latest Base block, base fee and suggested gas, zero parameters |
| 📄 `web_compile` | $0.001–5 | Public URL → bounded Markdown with resolved links, citations and a reusable artifact |
| 🔎 `evidence_artifact` | $0.001–3 | Can this public artifact be reused? Provenance, field validity, recomputation input |
| 🤝 `demand_pledge` | free | Name a capability you would pay for. Credit only after the same wallet pays for it later |

Calling a paid tool returns a `402` carrying the payment challenge in
`error.data.paymentRequired`, the payable resource URL in `error.data.resource`,
and the terms (network, asset, amount, `payTo`) in `error.data.offer`.

**Over stdio you cannot pay by retrying the tool call.** stdio has no headers in
either direction, so there is nowhere for a `PAYMENT-SIGNATURE` to travel back
through. Two ways to settle, both of which leave **this package never touching a
private key**:

- **Pay the resource over HTTP.** Sign `error.data.paymentRequired` with your
  x402 client and send the signed request to `error.data.resource`. It returns
  the same payload the tool would have, receipt included, billed once.
- **Use the remote server instead of this package.** If your client supports
  remote MCP, point it at `https://www.tereno.xyz/api/mcp`. That transport does
  have headers, so signing the challenge and retrying the same tool call is the
  normal flow and everything stays inside MCP.

> 🔒 `transaction_intent_guard` is never cached, shared or resold. An unsigned
> transaction is intent, and it stays with the wallet that paid for it.

## ⚙️ Configuration

| Env | Default | Purpose |
|---|---|---|
| `TERENO_WALLET` | — | Base address announced before payment, so a challenge can be bound to the wallet that will settle it. Optional. |
| `TERENO_BASE_URL` | `https://www.tereno.xyz` | Point at another Tereno deployment. |
| `TERENO_TIMEOUT_MS` | `45000` | Upstream request timeout. |
| `TERENO_EVIDENCE_INSTALLATION_ID` | — | Optional stable random id for this MCP installation. It is hashed only when resolving evidence received from another agent; never use a wallet or secret. |

## 🔐 What this package does and does not do

It is a **stdio transport** in front of the hosted endpoint at
[`/api/mcp`](https://www.tereno.xyz/api/mcp). Messages are forwarded verbatim, so
the tool list, the prices and the payment challenge all come from the same place
an HTTP agent sees — and this package needs no release when a capability changes.

The one thing it translates is payment, and the translation is lossy in one
direction. Over HTTP the challenge arrives in a response header and the caller
retries with a `PAYMENT-SIGNATURE` header. stdio has neither, so the challenge is
folded into the JSON-RPC error payload where a client can still reach it, while
the signature has no way back in. That is why a paid call is settled against the
resource URL rather than by retrying the tool, and why a client that speaks
remote MCP should prefer the hosted endpoint.

**No private key is ever read, stored or transmitted.** There are no
dependencies, and the whole thing is one readable file — [read it](./bin/tereno-mcp.mjs)
before you let it run on your machine.

If your client supports remote MCP servers, skip this package and point it
straight at `https://www.tereno.xyz/api/mcp`.

## 🌱 How it stays cheap — the cooperative layer

Tereno is a **shared-cache coordination layer**, not just an API. The first agent
to pay for a given piece of verified work seeds it for the whole network; every
later agent that reuses that answer pays less, and the seeder earns a small,
non-transferable credit that discounts its own future calls.

Safety is a public good with a private cost. By making the first computation earn
from every reuse, the network turns *"I paid to check this contract"* into *"I
lowered the price of checking it for everyone, and my own checks got cheaper."*

> The honest fine print: rewards are **non-transferable credits**, capped per
> artifact. They fund your agent's budget, they are not yield.

Discovery, scoring, reputation, pricing and the global cache live in the closed
Tereno backend. This server and its SDK
([`tereno-client`](https://www.npmjs.com/package/tereno-client)) are the public,
open interface to it.

## 🤝 Support & community

- 💬 **Questions / setup** → [Tereno Discord](https://discord.gg/YsgGSRBxn)
- 🐛 **Bugs** → [issues](https://github.com/tereno-xyz/tereno-mcp/issues) · ⚠️ never paste private keys or `.env`
- 🔒 **Vulnerabilities** → [report privately](https://github.com/tereno-xyz/tereno-mcp/security/advisories/new)

## 🔗 Links

[Live catalog](https://www.tereno.xyz/api/v1/capabilities) ·
[OpenAPI](https://www.tereno.xyz/openapi.yaml) ·
[MCP registry entry](https://registry.modelcontextprotocol.io/v0/servers?search=tereno) ·
[plugin-tereno for ElizaOS](https://github.com/RobMartello/plugin-tereno) ·
[tereno-client SDK](https://www.npmjs.com/package/tereno-client)

---

<div align="center">

**[tereno.xyz](https://www.tereno.xyz)** · Verdicts before signatures, for agents on Base.

</div>
