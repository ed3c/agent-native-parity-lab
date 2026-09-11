import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const comparator = new URL("./compare-evidence.mjs", import.meta.url).pathname;
const baseline = {
  schema_version: 1,
  scenario_id: "confirmed-navigation",
  transitions: ["IDLE", "WAITING_FOR_CONFIRMATION", "EXECUTING", "VERIFYING", "APPLIED"],
  final_state: "APPLIED",
  dispatch_count: 1,
  effect: { operation_id: "nav-001", type: "NAVIGATE", target: "page-b" },
};

async function runComparison(changeIOS = {}) {
  const directory = await mkdtemp(join(tmpdir(), "parity-"));
  const androidPath = join(directory, "android.json");
  const iosPath = join(directory, "ios.json");
  await writeFile(androidPath, JSON.stringify({ ...baseline, platform: "android" }));
  await writeFile(iosPath, JSON.stringify({ ...baseline, ...changeIOS, platform: "ios" }));
  return spawnSync(process.execPath, [comparator, androidPath, iosPath], { encoding: "utf8" });
}

test("accepts equivalent portable evidence", async () => {
  const result = await runComparison();
  assert.equal(result.status, 0, result.stderr);
});

test("planted platform divergence is rejected", async () => {
  const result = await runComparison({ dispatch_count: 2 });
  assert.notEqual(result.status, 0);
});
