import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const PIN = Object.freeze({
  checkpointId: "exact-navigation",
  kmpCommit: "bcb79473eaa6bb2e09f287462aa932a7fdab4957",
  kmpTree: "9fe624d903c429940cd8de0bd05bdf66fd63e4a1",
  labParentCommit: "1474ced5dcfb04db9d4f051d377ed17d8cb12b3d",
  labParentTree: "35ff632fd085b16376850ec498a381626d6bfccf",
  receiptRole: "DETERMINISTIC_TEST_FIXTURE",
  authorityIdentity: "NOT_VERIFIED",
  maximumClaim: "LOCAL_PLAN_APPROVAL_BINDING",
});

const REQUIRED_NON_CLAIMS = Object.freeze([
  "PLAN_QUALITY",
  "REVIEWER_IDENTITY",
  "NATIVE_RUNTIME_PARITY",
  "KMP_RUNTIME_PARITY",
  "MERGED",
  "RELEASED",
  "PRODUCTION",
]);

export class PlanApprovalError extends Error {
  constructor(code, message) {
    super(`[${code}] ${message}`);
    this.name = "PlanApprovalError";
    this.code = code;
  }
}

const requireEqual = (actual, expected, code, field) => {
  if (actual !== expected) {
    throw new PlanApprovalError(code, `${field} must equal the bound value`);
  }
};

export function hashExactPlanBytes(planBytes) {
  return createHash("sha256").update(planBytes).digest("hex");
}

export function validatePlanApproval(planBytes, receipt) {
  requireEqual(receipt.schema_version, 1, "PLAN_RECEIPT_SCHEMA_INVALID", "schema_version");
  requireEqual(receipt.checkpoint_id, PIN.checkpointId, "CHECKPOINT_ID_MISMATCH", "checkpoint_id");
  requireEqual(receipt.receipt_role, PIN.receiptRole, "RECEIPT_ROLE_INVALID", "receipt_role");
  requireEqual(
    receipt.authority_identity,
    PIN.authorityIdentity,
    "AUTHORITY_IDENTITY_CLAIM_INVALID",
    "authority_identity",
  );
  requireEqual(receipt.source?.commit, PIN.kmpCommit, "KMP_SOURCE_COMMIT_MISMATCH", "source.commit");
  requireEqual(receipt.source?.tree, PIN.kmpTree, "KMP_SOURCE_TREE_MISMATCH", "source.tree");
  requireEqual(
    receipt.lab_parent?.commit,
    PIN.labParentCommit,
    "LAB_PARENT_COMMIT_MISMATCH",
    "lab_parent.commit",
  );
  requireEqual(
    receipt.lab_parent?.tree,
    PIN.labParentTree,
    "LAB_PARENT_TREE_MISMATCH",
    "lab_parent.tree",
  );
  requireEqual(
    receipt.maximum_claim,
    PIN.maximumClaim,
    "PLAN_APPROVAL_EVIDENCE_CEILING_INVALID",
    "maximum_claim",
  );

  const nonClaims = [...(receipt.claims_not_made ?? [])].sort();
  const requiredNonClaims = [...REQUIRED_NON_CLAIMS].sort();
  if (JSON.stringify(nonClaims) !== JSON.stringify(requiredNonClaims)) {
    throw new PlanApprovalError(
      "PLAN_APPROVAL_NON_CLAIMS_INVALID",
      "claims_not_made must preserve every bound non-claim",
    );
  }

  const observedHash = hashExactPlanBytes(planBytes);
  requireEqual(observedHash, receipt.plan_sha256, "PLAN_HASH_MISMATCH", "plan_sha256");

  return {
    checkpoint_id: receipt.checkpoint_id,
    plan_sha256: observedHash,
    source: receipt.source,
    lab_parent: receipt.lab_parent,
    maximum_claim: receipt.maximum_claim,
  };
}

async function main() {
  const [planArg, receiptArg] = process.argv.slice(2);
  if (!planArg || !receiptArg) {
    throw new PlanApprovalError(
      "PLAN_APPROVAL_USAGE_INVALID",
      "usage: node harness/validate-plan-approval.mjs <plan> <receipt>",
    );
  }

  const planBytes = await readFile(resolve(planArg));
  const receipt = JSON.parse(await readFile(resolve(receiptArg), "utf8"));
  validatePlanApproval(planBytes, receipt);
  console.log("PLAN_APPROVAL_PASS");
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isCli) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export const pinnedPlanApproval = PIN;
