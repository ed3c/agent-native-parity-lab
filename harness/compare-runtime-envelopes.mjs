#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import {
  assertControlInvariants,
  compareRuntimeEnvelopes,
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
  present.push({ path, document });
}

const failures = [];
for (let i = 1; i < present.length; i += 1) {
  failures.push(...compareRuntimeEnvelopes(present[0].document, present[i].document));
}

for (const controlPath of controlPaths) {
  const controls = JSON.parse(await readFile(controlPath, "utf8"));
  failures.push(...assertControlInvariants(controls));
}

const summary = {
  schema_version: 1,
  comparator: "runtime-envelopes",
  fixture_sha256: digest,
  present_subjects: present.map((item) => item.document.subject),
  absent_subjects: absent.map((item) => ({
    subject: item.document.subject,
    status: item.document.status,
    reason: item.document.reason,
  })),
  failures,
  result: failures.length === 0 ? "PASS" : "FAIL",
  evidence_ceiling:
    absent.length === 0 && present.length >= 2
      ? "HOST_TEST_PARITY_OR_HIGHER_IF_RUNTIME_JOBS_PASS"
      : "PROBE_PARTIAL_ABSENT_SUBJECT",
  maximum_claim:
    failures.length === 0 && absent.some((item) => item.document.subject === "KMP_REFERENCE")
      ? "KMP_NATIVE_RUNTIME_PROBE_MEASURED_WITH_KMP_ABSENT"
      : failures.length === 0
        ? "KMP_NATIVE_RUNTIME_PROBE_COMPARATOR_PASS"
        : "KMP_NATIVE_RUNTIME_PROBE_FAIL",
};

if (failures.length > 0) {
  console.error(JSON.stringify(summary, null, 2));
  console.error(`runtime-parity fingerprint: ${failures.join(",")}`);
  process.exit(1);
}

console.log(JSON.stringify(summary, null, 2));
console.log("runtime-parity: PASS");
