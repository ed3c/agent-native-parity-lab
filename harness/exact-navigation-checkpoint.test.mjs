import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contract = JSON.parse(
  await readFile(new URL("../contracts/checkpoints/exact-navigation.v1.json", import.meta.url), "utf8"),
);
const fixture = JSON.parse(
  await readFile(new URL("../fixtures/exact-navigation/checkpoint.json", import.meta.url), "utf8"),
);

test("binds one approved checkpoint without shared implementation", () => {
  assert.equal(contract.schema_version, 1);
  assert.equal(contract.checkpoint_id, "exact-navigation");
  assert.equal(fixture.checkpoint_id, contract.checkpoint_id);
  assert.equal(
    contract.approved_plan_sha256,
    "9ff2a685df39e700406848683f1133a8bae1ada69ef2dfdbe5ef1e61979ed086",
  );
  assert.equal(contract.reference.kind, "STATIC_KMP_CONTRACT");
  assert.equal(contract.shared_implementation, false);
  assert.deepEqual(contract.implementations, [
    "ANDROID_KOTLIN_COMPOSE",
    "IOS_SWIFT_SWIFTUI",
  ]);
});

test("keeps effects and evidence bounded", () => {
  assert.equal(contract.effect_port, "IN_MEMORY_RECORDING");
  assert.equal(contract.duplicate_failure_fingerprint, "CHECKPOINT_DUPLICATE_DISPATCH");
  assert.equal(contract.evidence_ceiling, "NATIVE_CONTRACT_PARITY");
  assert.ok(contract.claims_not_made.includes("KMP_RUNTIME_PARITY"));
  assert.ok(contract.claims_not_made.includes("PHYSICAL_DEVICE"));
  assert.ok(contract.claims_not_made.includes("PRODUCTION"));
});

test("requires the four approved behavior controls", () => {
  assert.deepEqual(contract.required_controls, [
    "DISPATCH_WITHOUT_APPROVAL",
    "DUPLICATE_OPERATION_DISPATCH",
    "STALE_PAGE_GENERATION",
    "CALLBACK_WITH_MISMATCHED_POSTCONDITION",
  ]);
});
