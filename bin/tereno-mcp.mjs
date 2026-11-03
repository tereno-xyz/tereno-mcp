#!/usr/bin/env node

// Tereno MCP server: a stdio transport in front of the hosted JSON-RPC endpoint.
//
// Nothing about the protocol is reimplemented here. Every message is forwarded
// verbatim to https://www.tereno.xyz/api/mcp, so the tool list, the prices and
// the payment challenge all come from the same place an HTTP agent sees, and
// this package never has to be redeployed when a capability changes.
//
// The one thing it does translate is payment, and the translation is lossy in a
// way worth naming. Over HTTP the 402 challenge arrives in a response header and
// the caller retries with a PAYMENT-SIGNATURE header. stdio has no headers in
// either direction: the challenge can still be folded into the JSON-RPC error
// payload, but the signature has nowhere to come back through. So a paid tool
// cannot be settled by retrying it here, and saying otherwise sends an agent
// round a loop with no exit.
//
// What it does instead is hand the call off: the challenge names the capability's
// own invoke URL, which is payable by any x402 HTTP client and returns the same
// payload this tool would have. The 402 below says that explicitly and points at
// that URL rather than at this endpoint.

import { createInterface } from "node:readline";

// Travels in the user-agent, and the demand panel counts installs by it, so it
// has to track the published version rather than drift from it.
const VERSION = "0.1.6";
const BASE_URL = (process.env.TERENO_BASE_URL || "https://www.tereno.xyz").replace(/\/+$/, "");
const ENDPOINT = BASE_URL + "/api/mcp";
const WALLET = process.env.TERENO_WALLET?.trim();
// Stable opaque id, supplied by the operator. The hosted server hashes it only
// when evidence received from another agent is resolved; it is never a wallet.
const EVIDENCE_INSTALLATION_ID = process.env.TERENO_EVIDENCE_INSTALLATION_ID?.trim();
const TIMEOUT_MS = Number(process.env.TERENO_TIMEOUT_MS || 45_000);
const PAYMENT_REQUIRED_HEADER = "payment-required";

function send(message) {
  process.stdout.write(JSON.stringify(message) + "\n");
}

function errorFor(id, code, message, data) {
  return { jsonrpc: "2.0", id: id ?? null, error: data === undefined ? { code, message } : { code, message, data } };
}

// Reads the offer out of the base64 x402 challenge. This is not reimplementing
// payment: it is the only way to tell the agent *where* to pay, because the
// payable resource is the capability's invoke URL and never this JSON-RPC
// endpoint. Everything is optional on purpose, so a challenge whose shape we do
// not recognise degrades to "the challenge carries it" instead of throwing.
function readOffer(challenge) {
  if (!challenge) return null;
  try {
    const decoded = JSON.parse(Buffer.from(challenge, "base64").toString("utf8"));
    const accepts = Array.isArray(decoded?.accepts) ? decoded.accepts[0] : null;
    const url = typeof decoded?.resource?.url === "string" ? decoded.resource.url : null;
    if (!url && !accepts) return null;
    return {
      url,
      network: accepts?.network ?? null,
      asset: accepts?.asset ?? null,
      // Smallest unit of `asset`, not USD. Naming it loosely is how an agent
      // ends up signing six orders of magnitude more than it meant to.
      amountInAssetUnits: accepts?.amount ?? null,
      payTo: accepts?.payTo ?? null,
      maxTimeoutSeconds: accepts?.maxTimeoutSeconds ?? null,
    };
  } catch {
    return null;
  }
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
    if (EVIDENCE_INSTALLATION_ID) headers["x-tereno-evidence-installation"] = EVIDENCE_INSTALLATION_ID;

    const response = await fetch(ENDPOINT, {
      method: "POST", headers, body: JSON.stringify(request), signal: controller.signal,
    });

    // Notifications get 202 and no body, and expect nothing written back.
    if (response.status === 202) return null;

    if (response.status === 402) {
      const challenge = response.headers.get(PAYMENT_REQUIRED_HEADER);
      const offer = readOffer(challenge);
      const where = offer?.url
        ? `send the signed request to data.resource (${offer.url})`
        : "send the signed request to the resource URL named inside that challenge";
      return errorFor(request.id, 402,
        "Payment required, and this transport cannot carry the payment. stdio has no "
        + "headers, so retrying this tool call with a PAYMENT-SIGNATURE is not possible "
        + "and no argument on this tool accepts one. Settle it over HTTP instead: sign "
        + `data.paymentRequired with an x402 client and ${where}. That returns the same `
        + "payload this tool would have returned, including the receipt, and it is billed "
        + "once. Free here, needing no wallet and no payment: tereno_agent_rules, tereno_catalog, tereno_price, "
        + "tereno_receipt, tereno_evidence_reference, tereno_publish and demand_pledge. Call tereno_agent_rules "
        + "or tereno_price first to understand cache discounts and seeder dividend economics.",
        {
          paymentRequired: challenge,
          // The payable resource, which is the capability's invoke URL. This
          // used to carry the MCP endpoint, which is not payable and is not
          // what an x402 client should be pointed at.
          resource: offer?.url ?? null,
          offer,
          mcpEndpoint: ENDPOINT,
        });
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
