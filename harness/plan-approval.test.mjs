import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { validatePlanApproval } from "./validate-plan-approval.mjs";

const planPath = new URL("../approvals/exact-navigation/plan.md", import.meta.url);
const receiptPath = new URL("../approvals/exact-navigation/receipt.json", import.meta.url);
const driftPath = new URL("./fixtures/exact-navigation-plan-drift.md", import.meta.url);

const planBytes = await readFile(planPath);
const driftBytes = await readFile(driftPath);
const receipt = JSON.parse(await readFile(receiptPath, "utf8"));

const expectCode = (fn, code) => {
  assert.throws(fn, (error) => error?.code === code && error.message.startsWith(`[${code}]`));
};

test("accepts the exact plan bytes and bound subjects", () => {
  const result = validatePlanApproval(planBytes, receipt);
  assert.equal(result.checkpoint_id, "exact-navigation");
  assert.equal(result.maximum_claim, "LOCAL_PLAN_APPROVAL_BINDING");
});

test("rejects behavior-bearing plan drift", () => {
  expectCode(() => validatePlanApproval(driftBytes, receipt), "PLAN_HASH_MISMATCH");
});

test("direct RED command exits non-zero with a stable fingerprint", () => {
  const result = spawnSync(
    process.execPath,
    [
      new URL("./validate-plan-approval.mjs", import.meta.url),
      driftPath,
      receiptPath,
    ].map((value) => fileURL(value)),
    { encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /^\[PLAN_HASH_MISMATCH\]/m);
});

test("rejects a wrong KMP source commit", () => {
  const changed = structuredClone(receipt);
  changed.source.commit = `a${changed.source.commit.slice(1)}`;
  expectCode(() => validatePlanApproval(planBytes, changed), "KMP_SOURCE_COMMIT_MISMATCH");
});

test("rejects a wrong KMP source tree", () => {
  const changed = structuredClone(receipt);
  changed.source.tree = `a${changed.source.tree.slice(1)}`;
  expectCode(() => validatePlanApproval(planBytes, changed), "KMP_SOURCE_TREE_MISMATCH");
});

test("rejects a wrong lab parent commit", () => {
  const changed = structuredClone(receipt);
  changed.lab_parent.commit = `a${changed.lab_parent.commit.slice(1)}`;
  expectCode(() => validatePlanApproval(planBytes, changed), "LAB_PARENT_COMMIT_MISMATCH");
});

test("rejects a wrong lab parent tree", () => {
  const changed = structuredClone(receipt);
  changed.lab_parent.tree = `a${changed.lab_parent.tree.slice(1)}`;
  expectCode(() => validatePlanApproval(planBytes, changed), "LAB_PARENT_TREE_MISMATCH");
});

test("rejects an evidence promotion", () => {
  const changed = structuredClone(receipt);
  changed.maximum_claim = "KMP_RUNTIME_PARITY";
  expectCode(() => validatePlanApproval(planBytes, changed), "PLAN_APPROVAL_EVIDENCE_CEILING_INVALID");
});

test("rejects a false authority identity claim", () => {
  const changed = structuredClone(receipt);
  changed.authority_identity = "VERIFIED_HUMAN";
  expectCode(() => validatePlanApproval(planBytes, changed), "AUTHORITY_IDENTITY_CLAIM_INVALID");
});

function fileURL(value) {
  return value instanceof URL ? value.pathname : value;
}
