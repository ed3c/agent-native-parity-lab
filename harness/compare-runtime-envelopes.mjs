#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import {
  assertControlInvariants,
  compareRuntimeEnvelopes,
  isElevatedRuntimeClass,
  loadFixtureDigest,
  validateAbsenceReceipt,
  validateRuntimeEnvelope,
} from "./validate-runtime-envelope.mjs";

const paths = process.argv.slice(2);
if (paths.length === 0) {
  throw new Error(
    "usage: node harness/compare-runtime-envelopes.mjs <envelope-or-receipt.json>...",
  );
}

const { digest } = await loadFixtureDigest();
const present = [];
const absent = [];
const controlPaths = [];
const hostOnly = [];

for (const path of paths) {
  if (path.endsWith("controls.json")) {
    controlPaths.push(path);
    continue;
  }
  const document = JSON.parse(await readFile(path, "utf8"));
  if (document.status && document.status !== "PASS") {
    validateAbsenceReceipt(document);
    absent.push({ path, document });
    continue;
  }
  validateRuntimeEnvelope(document, { expectedFixtureSha256: digest });
  const entry = { path, document };
  if (isElevatedRuntimeClass(document.runtime_class)) {
    present.push(entry);
  } else if (document.runtime_class === "HOST") {
    hostOnly.push(entry);
  } else {
    present.push(entry);
  }
}

// Prefer elevated (EMULATOR/SIMULATOR) envelopes for primary comparison.
// HOST envelopes are retained and reported separately — never promoted.
const compareSet = present.length >= 1 ? present : hostOnly;
const failures = [];
for (let i = 1; i < compareSet.length; i += 1) {
  failures.push(...compareRuntimeEnvelopes(compareSet[0].document, compareSet[i].document));
}

for (const controlPath of controlPaths) {
  const controls = JSON.parse(await readFile(controlPath, "utf8"));
  failures.push(...assertControlInvariants(controls));
}

const elevatedNatives = present.filter((item) =>
  ["ANDROID_NATIVE", "IOS_NATIVE"].includes(item.document.subject),
);
const elevatedAndroid = elevatedNatives.some(
  (item) => item.document.subject === "ANDROID_NATIVE" && item.document.runtime_class === "EMULATOR",
);
const elevatedIos = elevatedNatives.some(
  (item) => item.document.subject === "IOS_NATIVE" && item.document.runtime_class === "SIMULATOR",
);
const kmpAbsent = absent.some((item) => item.document.subject === "KMP_REFERENCE");
const bothElevatedNatives = elevatedAndroid && elevatedIos;

let evidenceCeiling;
let maximumClaim;
if (failures.length > 0) {
  evidenceCeiling = "PROBE_FAIL";
  maximumClaim = "KMP_NATIVE_RUNTIME_PROBE_FAIL";
} else if (bothElevatedNatives) {
  evidenceCeiling = "SIMULATOR_RUNTIME_PARITY";
  maximumClaim = kmpAbsent
    ? "SIMULATOR_RUNTIME_PARITY_NATIVE_WITH_KMP_ABSENT"
    : "SIMULATOR_RUNTIME_PARITY";
} else if (compareSet.length >= 2 && compareSet.every((item) => item.document.runtime_class === "HOST")) {
  evidenceCeiling = "HOST_TEST_PARITY";
  maximumClaim = kmpAbsent
    ? "KMP_NATIVE_RUNTIME_PROBE_MEASURED_WITH_KMP_ABSENT"
    : "KMP_NATIVE_RUNTIME_PROBE_COMPARATOR_PASS";
} else if (absent.length > 0 || present.length + hostOnly.length < 2) {
  evidenceCeiling = "PROBE_PARTIAL_ABSENT_SUBJECT";
  maximumClaim = kmpAbsent
    ? "KMP_NATIVE_RUNTIME_PROBE_MEASURED_WITH_KMP_ABSENT"
    : "KMP_NATIVE_RUNTIME_PROBE_COMPARATOR_PASS";
} else {
  evidenceCeiling = "HOST_TEST_PARITY_OR_HIGHER_IF_RUNTIME_JOBS_PASS";
  maximumClaim = "KMP_NATIVE_RUNTIME_PROBE_COMPARATOR_PASS";
}

const summary = {
  schema_version: 1,
  comparator: "runtime-envelopes",
  fixture_sha256: digest,
  present_subjects: present.map((item) => ({
    subject: item.document.subject,
    runtime_class: item.document.runtime_class,
    path: item.path,
  })),
  host_only_subjects: hostOnly.map((item) => ({
    subject: item.document.subject,
    runtime_class: item.document.runtime_class,
    path: item.path,
  })),
  absent_subjects: absent.map((item) => ({
    subject: item.document.subject,
    status: item.document.status,
    reason: item.document.reason,
  })),
  compared_runtime_classes: compareSet.map((item) => item.document.runtime_class),
  failures,
  result: failures.length === 0 ? "PASS" : "FAIL",
  evidence_ceiling: evidenceCeiling,
  maximum_claim: maximumClaim,
  non_claims: [
    "PHYSICAL_DEVICE_PARITY",
    "WEBVIEW_RUNTIME",
    "WKWEBVIEW_RUNTIME",
    "A4",
    "MERGED",
    "KMP_RUNTIME_PARITY",
  ],
};

if (failures.length > 0) {
  console.error(JSON.stringify(summary, null, 2));
  console.error(`runtime-parity fingerprint: ${failures.join(",")}`);
  process.exit(1);
}

console.log(JSON.stringify(summary, null, 2));
console.log("runtime-parity: PASS");
