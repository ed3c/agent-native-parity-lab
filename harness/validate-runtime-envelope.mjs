#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SUBJECTS = new Set(["KMP_REFERENCE", "ANDROID_NATIVE", "IOS_NATIVE"]);
const PLATFORMS = new Set(["android", "ios"]);
const RESULTS = new Set(["ACCEPTED", "REJECTED", "UNKNOWN"]);
const PROBE_STATUSES = new Set(["PASS", "ABSENT", "NOT_IMPLEMENTED", "NOT_EXERCISED"]);
const ACCEPTED_EVENTS = [
  "navigation_requested",
  "navigation_approved",
  "navigation_dispatched",
  "navigation_verified",
];

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function sha256Hex(text) {
  return createHash("sha256").update(text).digest("hex");
}

export async function loadFixtureDigest() {
  const raw = await readFile(join(root, "fixtures/exact-navigation/checkpoint.json"), "utf8");
  return { raw, digest: sha256Hex(raw) };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateAbsenceReceipt(receipt) {
  assert.ok(isObject(receipt), "absence receipt must be an object");
  assert.ok(SUBJECTS.has(receipt.subject), `invalid subject: ${receipt.subject}`);
  assert.ok(PROBE_STATUSES.has(receipt.status), `invalid status: ${receipt.status}`);
  assert.ok(
    ["ABSENT", "NOT_IMPLEMENTED", "NOT_EXERCISED"].includes(receipt.status),
    "status must be non-pass probe state",
  );
  assert.equal(receipt.checkpoint_id, "exact-navigation.v1");
  assert.equal(typeof receipt.reason, "string");
  assert.ok(receipt.reason.length > 0, "reason required");
  if (receipt.fixture_sha256 !== undefined) {
    assert.match(receipt.fixture_sha256, /^[a-f0-9]{64}$/);
  }
  return receipt;
}

export function validateRuntimeEnvelope(envelope, { expectedFixtureSha256 } = {}) {
  assert.ok(isObject(envelope), "envelope must be an object");
  assert.ok(SUBJECTS.has(envelope.subject), `invalid subject: ${envelope.subject}`);
  assert.ok(PLATFORMS.has(envelope.platform), `invalid platform: ${envelope.platform}`);
  assert.match(envelope.fixture_sha256, /^[a-f0-9]{64}$/, "fixture_sha256 must be sha256 hex");
  if (expectedFixtureSha256) {
    assert.equal(envelope.fixture_sha256, expectedFixtureSha256, "fixture_sha256 mismatch");
  }
  assert.equal(envelope.checkpoint_id, "exact-navigation.v1");
  assert.ok(Array.isArray(envelope.events), "events must be an array");
  assert.ok(RESULTS.has(envelope.result), `invalid result: ${envelope.result}`);
  assert.equal(typeof envelope.effect_count, "number");
  assert.ok(Number.isInteger(envelope.effect_count) && envelope.effect_count >= 0);

  let previousSequence = 0;
  for (const [index, event] of envelope.events.entries()) {
    assert.ok(isObject(event), `events[${index}] must be object`);
    assert.equal(typeof event.sequence, "number");
    assert.equal(event.sequence, index + 1, "event.sequence must be contiguous from 1");
    assert.ok(event.sequence > previousSequence);
    previousSequence = event.sequence;
    assert.equal(typeof event.name, "string");
    assert.ok(event.name.length > 0);
    assert.equal(typeof event.operation_id, "string");
    assert.equal(typeof event.destination, "string");
    assert.match(event.payload_sha256, /^[a-f0-9]{64}$/);
  }

  if (envelope.result === "ACCEPTED") {
    assert.equal(envelope.effect_count, 1, "ACCEPTED requires effect_count === 1");
    assert.deepEqual(
      envelope.events.map((event) => event.name),
      ACCEPTED_EVENTS,
      "ACCEPTED envelope must emit the canonical event sequence",
    );
    const operationIds = new Set(envelope.events.map((event) => event.operation_id));
    assert.equal(operationIds.size, 1, "operation_id relation: single operation across events");
    const destinations = envelope.events.map((event) => event.destination);
    assert.ok(
      destinations.every((destination) => destination === destinations[0]),
      "destination relation",
    );
  }

  if (envelope.result === "REJECTED") {
    assert.equal(envelope.effect_count, 0, "REJECTED requires effect_count === 0");
  }

  if (envelope.result === "UNKNOWN") {
    assert.ok(envelope.effect_count <= 1, "UNKNOWN may dispatch at most once");
  }

  return envelope;
}

export function fingerprintMismatch(kind, detail) {
  return `${kind}:${detail}`;
}

export function compareRuntimeEnvelopes(left, right) {
  const failures = [];
  if (left.fixture_sha256 !== right.fixture_sha256) {
    failures.push(fingerprintMismatch("FIXTURE_SHA256", `${left.subject}!=${right.subject}`));
  }
  const leftNames = left.events.map((event) => event.name);
  const rightNames = right.events.map((event) => event.name);
  if (leftNames.length !== rightNames.length || leftNames.some((name, i) => name !== rightNames[i])) {
    failures.push(fingerprintMismatch(`${right.subject}`, `event:ORDER_NAME_COUNT_MISMATCH`));
  }
  const leftOp = left.events[0]?.operation_id;
  const rightOp = right.events[0]?.operation_id;
  if (leftOp !== rightOp) {
    failures.push(fingerprintMismatch(`${right.subject}`, `event:OPERATION_ID_RELATION_MISMATCH`));
  }
  const leftDest = left.events[0]?.destination;
  const rightDest = right.events[0]?.destination;
  if (leftDest !== rightDest) {
    failures.push(fingerprintMismatch(`${right.subject}`, `event:DESTINATION_RELATION_MISMATCH`));
  }
  if (left.result !== right.result) {
    failures.push(
      fingerprintMismatch(`${right.subject}`, `RESULT_MISMATCH:${left.result}!=${right.result}`),
    );
  }
  if (left.effect_count !== right.effect_count) {
    failures.push(fingerprintMismatch(`${right.subject}`, `EFFECT_COUNT_MISMATCH`));
  }
  return failures;
}

export function assertControlInvariants(envelopesByControl) {
  const failures = [];
  const duplicate = envelopesByControl.duplicate_dispatch;
  if (duplicate) {
    if (!(duplicate.result === "REJECTED" && duplicate.effect_count === 0)) {
      failures.push(fingerprintMismatch(duplicate.subject, "DUPLICATE_DISPATCH_NOT_REJECTED"));
    }
  }
  const stale = envelopesByControl.stale_approval;
  if (stale) {
    if (!(stale.result === "REJECTED" && stale.effect_count === 0)) {
      failures.push(fingerprintMismatch(stale.subject, "STALE_APPROVAL_NOT_REJECTED"));
    }
  }
  const mismatch = envelopesByControl.callback_destination_mismatch;
  if (mismatch) {
    if (mismatch.result !== "UNKNOWN") {
      failures.push(
        fingerprintMismatch(mismatch.subject, "CALLBACK_DESTINATION_MISMATCH_NOT_UNKNOWN"),
      );
    }
  }
  return failures;
}

function payloadDigest(parts) {
  return sha256Hex(JSON.stringify(parts));
}

export function buildAcceptedEnvelope({ subject, platform, fixtureSha256, operationId, destination }) {
  const events = ACCEPTED_EVENTS.map((name, index) => ({
    sequence: index + 1,
    name,
    operation_id: operationId,
    destination,
    payload_sha256: payloadDigest({ name, operationId, destination, sequence: index + 1 }),
  }));
  return {
    subject,
    platform,
    fixture_sha256: fixtureSha256,
    checkpoint_id: "exact-navigation.v1",
    events,
    result: "ACCEPTED",
    effect_count: 1,
  };
}

async function runSelftest() {
  const { digest } = await loadFixtureDigest();
  const android = buildAcceptedEnvelope({
    subject: "ANDROID_NATIVE",
    platform: "android",
    fixtureSha256: digest,
    operationId: "nav-001",
    destination: "page-b",
  });
  const ios = buildAcceptedEnvelope({
    subject: "IOS_NATIVE",
    platform: "ios",
    fixtureSha256: digest,
    operationId: "nav-001",
    destination: "page-b",
  });
  validateRuntimeEnvelope(android, { expectedFixtureSha256: digest });
  validateRuntimeEnvelope(ios, { expectedFixtureSha256: digest });
  assert.deepEqual(compareRuntimeEnvelopes(android, ios), []);

  const badFixture = { ...ios, fixture_sha256: "0".repeat(64) };
  assert.ok(compareRuntimeEnvelopes(android, badFixture).some((item) => item.startsWith("FIXTURE_SHA256")));

  const badOrder = {
    ...ios,
    events: [...ios.events].reverse().map((event, index) => ({ ...event, sequence: index + 1 })),
  };
  assert.ok(compareRuntimeEnvelopes(android, badOrder).some((item) => item.includes("ORDER_NAME_COUNT")));

  const badOp = {
    ...ios,
    events: ios.events.map((event) => ({ ...event, operation_id: "nav-other" })),
  };
  assert.ok(compareRuntimeEnvelopes(android, badOp).some((item) => item.includes("OPERATION_ID_RELATION")));

  const badDest = {
    ...ios,
    events: ios.events.map((event) => ({ ...event, destination: "page-z" })),
  };
  assert.ok(compareRuntimeEnvelopes(android, badDest).some((item) => item.includes("DESTINATION_RELATION")));

  const plantedDuplicateAccepted = {
    ...android,
    result: "ACCEPTED",
    effect_count: 2,
  };
  assert.throws(() => validateRuntimeEnvelope(plantedDuplicateAccepted));

  const controlFailures = assertControlInvariants({
    duplicate_dispatch: {
      subject: "ANDROID_NATIVE",
      result: "ACCEPTED",
      effect_count: 1,
    },
    stale_approval: {
      subject: "ANDROID_NATIVE",
      result: "REJECTED",
      effect_count: 0,
    },
    callback_destination_mismatch: {
      subject: "ANDROID_NATIVE",
      result: "ACCEPTED",
    },
  });
  assert.ok(controlFailures.includes("ANDROID_NATIVE:DUPLICATE_DISPATCH_NOT_REJECTED"));
  assert.ok(controlFailures.includes("ANDROID_NATIVE:CALLBACK_DESTINATION_MISMATCH_NOT_UNKNOWN"));

  const healthyControls = assertControlInvariants({
    duplicate_dispatch: { subject: "ANDROID_NATIVE", result: "REJECTED", effect_count: 0 },
    stale_approval: { subject: "ANDROID_NATIVE", result: "REJECTED", effect_count: 0 },
    callback_destination_mismatch: {
      subject: "ANDROID_NATIVE",
      result: "UNKNOWN",
      effect_count: 1,
    },
  });
  assert.deepEqual(healthyControls, []);

  validateAbsenceReceipt({
    subject: "KMP_REFERENCE",
    status: "ABSENT",
    checkpoint_id: "exact-navigation.v1",
    fixture_sha256: digest,
    reason:
      "pinned KMP head bcb79473eaa6bb2e09f287462aa932a7fdab4957 has no exact-navigation.v1 checkpoint surface",
  });

  console.log("runtime-envelope selftest: PASS");
}

async function main(args) {
  if (args.includes("--selftest")) {
    await runSelftest();
    return;
  }
  if (args[0]) {
    const envelope = JSON.parse(await readFile(args[0], "utf8"));
    if (envelope.status && envelope.status !== "PASS") {
      validateAbsenceReceipt(envelope);
      console.log(`runtime-envelope absence receipt: ${envelope.status}`);
    } else {
      const { digest } = await loadFixtureDigest();
      validateRuntimeEnvelope(envelope, { expectedFixtureSha256: digest });
      console.log("runtime-envelope validation: PASS");
    }
    return;
  }
  console.log("usage: node harness/validate-runtime-envelope.mjs --selftest | <envelope.json>");
  process.exit(2);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main(process.argv.slice(2));
}
