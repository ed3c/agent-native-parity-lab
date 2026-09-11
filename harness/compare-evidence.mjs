import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [androidPath, iosPath] = process.argv.slice(2);
if (!androidPath || !iosPath) {
  throw new Error("usage: node harness/compare-evidence.mjs <android.json> <ios.json>");
}

const readEvidence = async (path) => JSON.parse(await readFile(path, "utf8"));
const normalize = ({ platform, ...portable }) => portable;

const android = await readEvidence(androidPath);
const ios = await readEvidence(iosPath);

assert.equal(android.platform, "android");
assert.equal(ios.platform, "ios");
assert.deepEqual(normalize(android), normalize(ios));
assert.equal(android.final_state, "APPLIED");
assert.equal(android.dispatch_count, 1);

console.log("dual-native evidence parity: PASS");
