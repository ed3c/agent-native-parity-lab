import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  assertControlInvariants,
  buildAcceptedEnvelope,
  compareRuntimeEnvelopes,
  loadFixtureDigest,
  validateAbsenceReceipt,
  validateRuntimeEnvelope,
} from "./validate-runtime-envelope.mjs";

const selftest = new URL("./validate-runtime-envelope.mjs", import.meta.url).pathname;
const comparator = new URL("./compare-runtime-envelopes.mjs", import.meta.url).pathname;

test("selftest passes", () => {
  const result = spawnSync(process.execPath, [selftest, "--selftest"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("planted destination mismatch fingerprints", async () => {
  const { digest } = await loadFixtureDigest();
  const left = buildAcceptedEnvelope({
    subject: "ANDROID_NATIVE",
    platform: "android",
    fixtureSha256: digest,
    operationId: "nav-001",
    destination: "page-b",
    runtimeClass: "EMULATOR",
  });
  const right = buildAcceptedEnvelope({
    subject: "IOS_NATIVE",
    platform: "ios",
    fixtureSha256: digest,
    operationId: "nav-001",
    destination: "page-c",
    runtimeClass: "SIMULATOR",
  });
  const failures = compareRuntimeEnvelopes(left, right);
  assert.ok(failures.includes("IOS_NATIVE:event:DESTINATION_RELATION_MISMATCH"));
});

test("planted duplicate-dispatch control fails closed", () => {
  const failures = assertControlInvariants({
    duplicate_dispatch: { subject: "IOS_NATIVE", result: "ACCEPTED", effect_count: 2 },
  });
  assert.ok(failures.includes("IOS_NATIVE:DUPLICATE_DISPATCH_NOT_REJECTED"));
});

test("require-runtime-class rejects HOST masquerading as EMULATOR", async () => {
  const { digest } = await loadFixtureDigest();
  const directory = await mkdtemp(join(tmpdir(), "runtime-class-"));
  const host = buildAcceptedEnvelope({
    subject: "ANDROID_NATIVE",
    platform: "android",
    fixtureSha256: digest,
    operationId: "nav-001",
    destination: "page-b",
    runtimeClass: "HOST",
  });
  const path = join(directory, "host.json");
  await writeFile(path, JSON.stringify(host));
  const result = spawnSync(
    process.execPath,
    [selftest, "--require-runtime-class", "EMULATOR", path],
    { encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr || result.stdout, /runtime_class must be EMULATOR|refusing HOST/);
});

test("comparator accepts matching elevated natives with KMP absent", async () => {
  const { digest } = await loadFixtureDigest();
  const directory = await mkdtemp(join(tmpdir(), "runtime-parity-"));
  const android = buildAcceptedEnvelope({
    subject: "ANDROID_NATIVE",
    platform: "android",
    fixtureSha256: digest,
    operationId: "nav-001",
    destination: "page-b",
    runtimeClass: "EMULATOR",
  });
  const ios = buildAcceptedEnvelope({
    subject: "IOS_NATIVE",
    platform: "ios",
    fixtureSha256: digest,
    operationId: "nav-001",
    destination: "page-b",
    runtimeClass: "SIMULATOR",
  });
  const absent = {
    subject: "KMP_REFERENCE",
    status: "ABSENT",
    checkpoint_id: "exact-navigation.v1",
    fixture_sha256: digest,
    reason: "no exact-navigation.v1 checkpoint surface at pinned KMP head",
  };
  validateRuntimeEnvelope(android, {
    expectedFixtureSha256: digest,
    requireRuntimeClass: "EMULATOR",
  });
  validateRuntimeEnvelope(ios, {
    expectedFixtureSha256: digest,
    requireRuntimeClass: "SIMULATOR",
  });
  validateAbsenceReceipt(absent);
  const androidPath = join(directory, "android.json");
  const iosPath = join(directory, "ios.json");
  const kmpPath = join(directory, "kmp.json");
  await writeFile(androidPath, JSON.stringify(android));
  await writeFile(iosPath, JSON.stringify(ios));
  await writeFile(kmpPath, JSON.stringify(absent));
  const result = spawnSync(process.execPath, [comparator, androidPath, iosPath, kmpPath], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /SIMULATOR_RUNTIME_PARITY_NATIVE_WITH_KMP_ABSENT/);
  assert.match(result.stdout, /SIMULATOR_RUNTIME_PARITY/);
});

test("comparator keeps HOST-only claim below SIMULATOR_RUNTIME_PARITY", async () => {
  const { digest } = await loadFixtureDigest();
  const directory = await mkdtemp(join(tmpdir(), "runtime-host-"));
  const android = buildAcceptedEnvelope({
    subject: "ANDROID_NATIVE",
    platform: "android",
    fixtureSha256: digest,
    operationId: "nav-001",
    destination: "page-b",
    runtimeClass: "HOST",
  });
  const ios = buildAcceptedEnvelope({
    subject: "IOS_NATIVE",
    platform: "ios",
    fixtureSha256: digest,
    operationId: "nav-001",
    destination: "page-b",
    runtimeClass: "HOST",
  });
  const absent = {
    subject: "KMP_REFERENCE",
    status: "ABSENT",
    checkpoint_id: "exact-navigation.v1",
    fixture_sha256: digest,
    reason: "no exact-navigation.v1 checkpoint surface at pinned KMP head",
  };
  const androidPath = join(directory, "android.json");
  const iosPath = join(directory, "ios.json");
  const kmpPath = join(directory, "kmp.json");
  await writeFile(androidPath, JSON.stringify(android));
  await writeFile(iosPath, JSON.stringify(ios));
  await writeFile(kmpPath, JSON.stringify(absent));
  const result = spawnSync(process.execPath, [comparator, androidPath, iosPath, kmpPath], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /HOST_TEST_PARITY/);
  assert.doesNotMatch(result.stdout, /"maximum_claim": "SIMULATOR_RUNTIME_PARITY/);
});
