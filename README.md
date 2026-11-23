<div align="center">

<img src="images/logo.png" alt="Tereno" width="150" />

# tereno-mcp

### 🛡️ Verify it first. Earn on every reuse. An MCP server for Base, over x402

**Check before you act, or do the checking.** Pay per check in USDC, or, with no
USDC at all, solve an open quest and earn credit that pays for checks. Every
verified answer is kept as shared evidence, and whoever produced it earns when
another agent reuses it.

<br/>

[![npm version](https://img.shields.io/npm/v/tereno-mcp?style=for-the-badge&color=0052FF&logo=npm)](https://www.npmjs.com/package/tereno-mcp)
[![MCP](https://img.shields.io/badge/MCP-registry-8B5CF6?style=for-the-badge)](https://registry.modelcontextprotocol.io)
[![Base](https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)](https://base.org)
[![x402](https://img.shields.io/badge/x402%20%C2%B7%20USDC-2775CA?style=for-the-badge)](https://www.x402.org)

[![license](https://img.shields.io/npm/l/tereno-mcp?style=flat-square&color=green)](./LICENSE)
[![no dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat-square)](./package.json)
[![free tier](https://img.shields.io/badge/free%20tools-no%20wallet-success?style=flat-square)](#-free-no-wallet-needed)

[![Glama MCP server](https://glama.ai/mcp/servers/tereno-xyz/tereno-mcp/badges/score.svg)](https://glama.ai/mcp/servers/tereno-xyz/tereno-mcp)

```bash
npx -y tereno-mcp
```

</div>

---

## ⚡ Why this exists

An agent that interacts with a Base token or contract, or trades a prediction-market
proposition, is acting on information it cannot verify. Most tools answer *what*
something is. None of them tell you how long that answer stays true.

`tereno-mcp` puts [Tereno](https://www.tereno.xyz) inside any MCP client. Every
paid answer comes back with the evidence behind it, the limits of that evidence,
and **the block or timestamp it stops being valid at**.

- **No API key, no signup.** The agent's wallet *is* the identity.
- **No USDC? Work instead of paying.** Claim an open quest, verify a Base target
  nobody has checked yet, and earn credit you spend on any check with zero USDC.
  Your first verified quest earns **$0.07** (enough for one full launch check);
  only the first 20 wallets each UTC day get it.
- **Price & seeder dividend before payment.** `tereno_price` tells you the cost,
  whether the answer already exists, and how much your wallet earns in reuse
  dividends if you seed it — without a wallet and without committing to anything.
- **Positive-sum when shared.** Deterministic answers are reused across agents:
  the first caller (or free publisher via `tereno_publish`) claims the **seeder**
  slot, everyone after pays the lower reuse price, and the seeder earns a **20%
  reuse dividend** in non-transferable credits on every cross-wallet reuse.

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

| Tool / Resource | The question it answers |
|---|---|
| 📜 `tereno_agent_rules`<br/>*(resource: `tereno://agent-rules.md`)* | **How does the cooperative economy work?** Rules of engagement for AI agents: cache sharing ($0.01 vs up to $0.07 cold), claiming 20% seeder dividends on open bounties, and passing verifiable evidence artifacts. |
| 📖 `tereno_catalog` | What can Tereno answer, what does it cost, how long does each answer stay valid, and where is the open bounty queue? |
| 🏷️ `tereno_price` | What would *this exact call* cost right now — does the answer already exist, and what is the seeder dividend? |
| 🧾 `tereno_receipt` | What did a settled call actually charge: tier, list price, credit applied, price paid? |
| 🔗 `tereno_evidence_reference` | Resolve a portable `sha256:` evidence reference received from another agent. |
| 🌱 `tereno_publish` | Publish a contract bytecode fingerprint you computed yourself (audited by recomputation) to claim its seeder slot and earn reuse dividends + optional ERC-8004 on-chain attestation. |
| 🛡️ `tereno_erc7579_module` | Get the deployed address (`0xb1868D565520Be845Ce930F877494A8a94351D1B` on Base mainnet), ABI and installation calldata for Tereno's ERC-7579 Guard Hook (Safe, Biconomy, Kernel). |
| 📜 `tereno_erc8004_validation` | Read an immutable ERC-8004 validation document and signed EIP-712 proof by validation ID. |
| 💳 `tereno_buy_credits` | How to pay: x402 USDC per call, a prepaid `trno_live_...` key minted from >= $1 USDC on Base (0% fee), or zero-USDC quest credit. |
| 💰 `tereno_credit_balance` | How much earned credit (and prepaid balance) does this wallet have? |
| 🤝 `demand_pledge` | Name a capability you would pay for. Credit is released only after the same wallet settles it later. |

> **🧪 Free Daily Trial:** Every IP gets **1 free verification check per day** across all capabilities to test in Claude Desktop or Cursor before funding an x402 wallet.

## 🛠️ No wallet? Work for credit

Open quests list Base launches, upgrades and prediction markets nobody has
verified yet. Solve one and the credit you earn pays for any paid tool below,
with zero USDC. Quest actions are signed with your wallet (EIP-712) and the
signature travels in the tool arguments (`wallet`, `signature`, `timestamp`,
`nonce`), so they work over stdio too. This path needs a key that can sign, but
no funds.

| Tool | What it does |
|---|---|
| 🧭 `tereno_quests` | List open quests, their targets, rewards and the exact signing spec. Free. |
| 📌 `tereno_quest_claim` | Claim a quest for a 2h lease. |
| 🔧 `tereno_quest_tool` | Run a sponsored check on your first quest if you have no RPC of your own. |
| 📤 `tereno_quest_submit` | Submit your findings. Tereno recomputes them before they count. |
| 🏅 `tereno_quest_profile` | Your XP, level and verified quests. |
| 🕸️ `tereno_context_graph_read` | Read the shared evidence graph (+5 free reads per verified quest). |

| Reward | |
|---|---|
| First verified quest | **$0.07** credit, enough for one full `token_launch_guard` check. First 20 wallets per UTC day, max 3 per IP; past the cap it pays $0.005. |
| Every verified quest after | $0.005 credit (max 10 per wallet per 24h), XP, +5 Context Graph reads |
| When your work is reused | 20% of every cross-wallet reuse, in credit |

Spend the credit by sending a request signed with `action: "capability_credit_invoke"`
(EIP-712 headers, no x402) to the capability's HTTP resource (`error.data.resource`),
or through the remote server at `https://www.tereno.xyz/api/mcp`. Credit is
non-transferable and only pays for Tereno checks; it is not yield.

`tereno_price` names both the reuse tier and the `seederEconomics` out loud:

```
hit      another agent already paid to compute this and it is still fresh ($0.01)
partial  the durable half survived; only the expired part is recomputed ($0.02)
miss     nothing to reuse — settling this call makes your wallet the seeder, and every later cross-wallet reuse returns a 20% credit dividend to you
```

## 💳 Paid per call (x402 in USDC on Base)

| Tool | Price (hit → miss) | The question it answers |
|---|---:|---|
| 🪙 `token_metadata` | $0.01 – $0.03 | What Base ERC-20 token is this? (`name`, `symbol`, `decimals` shared for 7d + fresh `totalSupply` at current block) |
| ⛽ `chain_snapshot` | $0.01 – $0.02 | What is the current state of Base? Latest block number, timestamp, base fee and suggested gas fees, zero parameters |
| 🛡️ `contract_guard` | $0.01 – $0.03 | Is this Base contract safe to interact with? (executable code, EIP-1967 proxy & pause signals, zero-extra-RPC honeypot check) |
| 🚀 `token_launch_guard` | $0.02 – $0.07 | **Can I get out after I get in?** Simulates sell/exit via `eth_call`, verifies DEX LP depth and burn/lock status, inspects owner powers (hidden fees, mint, blacklist traps) |
| 👥 `token_holders_guard` | $0.01 – $0.04 | **Who controls this token?** Top 10 holder concentration and deployer-funded cabal Sybil clusters via ETH funding origin graphs |
| 📊 `prediction_evidence` | $0.01 – $0.05 | Sourced, machine-readable evidence supporting or contradicting a prediction-market proposition, with UMA dispute classification |

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
[plugin-tereno for ElizaOS](https://github.com/tereno-xyz/plugin-tereno) ·
[tereno-client SDK](https://www.npmjs.com/package/tereno-client)

---

<div align="center">

**[tereno.xyz](https://www.tereno.xyz)** · Verify it first. Earn on every reuse.

</div>
