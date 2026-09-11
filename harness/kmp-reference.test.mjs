import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { pinnedReference, requiredPaths, validateCheckout, validateManifest } from "./kmp-reference.mjs";

const manifest = JSON.parse(
  await readFile(new URL("../contracts/kmp-reference.v1.json", import.meta.url), "utf8"),
);

const observed = () => ({
  commit: pinnedReference.commit,
  tree: pinnedReference.tree,
  paths: [...requiredPaths],
  labCommit: "fixture-lab-head",
});

const expectCode = (fn, code) => {
  assert.throws(fn, (error) => error?.code === code && error.message.startsWith(`[${code}]`));
};

test("accepts the exact KMP reference manifest and checkout", () => {
  validateManifest(manifest);
  const receipt = validateCheckout(manifest, observed());
  assert.equal(receipt.source_state, "LEAF_COMPLETE_UNMERGED");
  assert.equal(receipt.maximum_claim, "KMP_REFERENCE_UNIT_REPLAY");
});

test("rejects a checkout commit mismatch", () => {
  const changed = observed();
  changed.commit = `a${changed.commit.slice(1)}`;
  expectCode(() => validateCheckout(manifest, changed), "KMP_REFERENCE_COMMIT_MISMATCH");
});

test("rejects a checkout tree mismatch", () => {
  const changed = observed();
  changed.tree = `a${changed.tree.slice(1)}`;
  expectCode(() => validateCheckout(manifest, changed), "KMP_REFERENCE_TREE_MISMATCH");
});

test("rejects a missing source path", () => {
  const changed = observed();
  changed.paths.pop();
  expectCode(() => validateCheckout(manifest, changed), "KMP_REFERENCE_PATH_MISSING");
});

test("rejects evidence promotion", () => {
  const changed = structuredClone(manifest);
  changed.replay.maximum_claim = "PHYSICAL_DEVICE_PASS";
  expectCode(() => validateManifest(changed), "KMP_REFERENCE_EVIDENCE_CEILING_INVALID");
});

test("rejects laundering an unmerged source into merged state", () => {
  const changed = structuredClone(manifest);
  changed.source.state = "MERGED";
  expectCode(() => validateManifest(changed), "KMP_REFERENCE_STATE_INVALID");
});
