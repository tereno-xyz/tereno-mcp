#!/usr/bin/env node

// Tereno MCP server: a stdio transport in front of the hosted JSON-RPC endpoint.
//
// Nothing about the protocol is reimplemented here. Every message is forwarded
// verbatim to https://www.tereno.xyz/api/mcp, so the tool list, the prices and
// the payment challenge all come from the same place an HTTP agent sees, and
// this package never has to be redeployed when a capability changes.
//
// The one thing it does translate is payment. Over HTTP the 402 challenge
// arrives in a response header; stdio has no headers, so the challenge is
// folded into the JSON-RPC error payload where an MCP client can still reach it.

import { createInterface } from "node:readline";

// Travels in the user-agent, and the demand panel counts installs by it, so it
// has to track the published version rather than drift from it.
const VERSION = "0.1.1";
const BASE_URL = (process.env.TERENO_BASE_URL || "https://www.tereno.xyz").replace(/\/+$/, "");
const ENDPOINT = BASE_URL + "/api/mcp";
const WALLET = process.env.TERENO_WALLET?.trim();
const TIMEOUT_MS = Number(process.env.TERENO_TIMEOUT_MS || 45_000);
const PAYMENT_REQUIRED_HEADER = "payment-required";

function send(message) {
  process.stdout.write(JSON.stringify(message) + "\n");
}

function errorFor(id, code, message, data) {
  return { jsonrpc: "2.0", id: id ?? null, error: data === undefined ? { code, message } : { code, message, data } };
}

async function forward(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers = {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent": `tereno-mcp/${VERSION} (stdio)`,
    };
    // Identifies the caller before payment, so a challenge can be bound to the
    // wallet that will settle it. Optional: everything free works without it.
    if (WALLET) headers["x-agent-wallet"] = WALLET;

    const response = await fetch(ENDPOINT, {
      method: "POST", headers, body: JSON.stringify(request), signal: controller.signal,
    });

    // Notifications get 202 and no body, and expect nothing written back.
    if (response.status === 202) return null;

    if (response.status === 402) {
      const challenge = response.headers.get(PAYMENT_REQUIRED_HEADER);
      return errorFor(request.id, 402,
        "Payment required. This tool is paid per call with x402 in USDC on Base. "
        + "Sign the challenge in data.paymentRequired and retry with a PAYMENT-SIGNATURE header, "
        + "or call tereno_price first to see what it costs. The free tools (tereno_catalog, "
        + "tereno_price, tereno_receipt) need no payment and no wallet.",
        { paymentRequired: challenge, resource: ENDPOINT });
    }

    const text = await response.text();
    if (!text) return errorFor(request.id, -32603, `Tereno returned an empty body (HTTP ${response.status})`);
    try {
      return JSON.parse(text);
    } catch {
      return errorFor(request.id, -32603, `Tereno returned a non-JSON body (HTTP ${response.status})`);
    }
  } catch (error) {
    const aborted = error?.name === "AbortError";
    return errorFor(request.id, -32000,
      aborted ? `Tereno did not answer within ${TIMEOUT_MS}ms` : `Tereno is unreachable: ${error?.message ?? String(error)}`);
  } finally {
    clearTimeout(timer);
  }
}

const input = createInterface({ input: process.stdin });
// Requests are answered concurrently, so stdin closing is not the end: a piped
// client sends every line and closes immediately, and exiting there would drop
// answers that were still in flight.
const inFlight = new Set();
let stdinClosed = false;

function drain() {
  if (stdinClosed && inFlight.size === 0) process.exit(0);
}

input.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch {
    // No id is recoverable from an unparseable line, so this is the one case
    // the spec answers with a null id.
    send(errorFor(null, -32700, "Parse error: each stdio line must be one JSON-RPC 2.0 message"));
    return;
  }

  // A notification carries no id and must not be answered, even on failure.
  const isNotification = request.id === undefined || request.id === null;
  const pending = forward(request)
    .then((response) => { if (response && !isNotification) send(response); })
    .catch((error) => { if (!isNotification) send(errorFor(request.id, -32603, String(error?.message ?? error))); })
    .finally(() => { inFlight.delete(pending); drain(); });
  inFlight.add(pending);
});

// Closing stdin is how an MCP client says it is done.
input.on("close", () => { stdinClosed = true; drain(); });
