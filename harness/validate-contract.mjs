import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = new URL("../contracts/navigation-gate.v1.json", import.meta.url);
const contract = JSON.parse(await readFile(path, "utf8"));

assert.equal(contract.schema_version, 1);
assert.equal(contract.contract_id, "bounded-navigation");
assert.equal(contract.reference.mode, "READ_ONLY_CONTROL");
assert.match(contract.reference.commit, /^[0-9a-f]{40}$/);
assert.equal(contract.shared_implementation, false);
assert.deepEqual(contract.admitted_effects, ["LOCAL_FIXTURE_NAVIGATION"]);
assert.deepEqual(contract.happy_path.transitions, [
  "IDLE",
  "WAITING_FOR_CONFIRMATION",
  "EXECUTING",
  "VERIFYING",
  "APPLIED",
]);
assert.equal(contract.happy_path.dispatch_count, 1);
assert.deepEqual(contract.negative_controls, [
  "DISPATCH_BEFORE_APPROVAL",
  "DUPLICATE_OPERATION",
  "STALE_PAGE_GENERATION",
  "CALLBACK_WITH_MISMATCHED_POSTCONDITION",
]);
assert.equal(contract.evidence_ceiling, "LOCAL_DETERMINISTIC_DOMAIN_PARITY");

console.log("contract: PASS");
