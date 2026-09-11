import assert from "node:assert/strict";

const PIN = Object.freeze({
  repository: "ed3c/kotlin-auto-webview",
  repositoryId: 1334777764,
  issue: 72,
  pullRequest: 156,
  parentCommit: "aad95c059add01ff183bf4a24b1b7cf32802412e",
  commit: "bcb79473eaa6bb2e09f287462aa932a7fdab4957",
  tree: "9fe624d903c429940cd8de0bd05bdf66fd63e4a1",
  state: "LEAF_COMPLETE_UNMERGED",
  selectedCiRun: 32288317843,
  upstreamCeiling: "PLAY_SAFE_WEBVIEW_COMPILE_PACKAGE_ONLY",
  replayTask: ":composeApp:testPlaySafeDebugUnitTest",
  maximumClaim: "KMP_REFERENCE_UNIT_REPLAY",
});

const REQUIRED_PATHS = Object.freeze([
  "composeApp/src/androidMain/kotlin/dev/ed3c/autowebview/executor/webview/PlaySafeWebViewBrowserActionPlatform.kt",
  "composeApp/src/androidMain/kotlin/dev/ed3c/autowebview/executor/webview/PlaySafeWebViewContracts.kt",
  "composeApp/src/androidUnitTest/kotlin/dev/ed3c/autowebview/executor/webview/PlaySafeWebViewContractsTest.kt",
  "docs/architecture/ADR-0031-play-safe-webview-actions.md",
]);

const REQUIRED_NON_CLAIMS = Object.freeze([
  "WEBVIEW_RUNTIME",
  "EMULATOR",
  "PHYSICAL_DEVICE",
  "PRODUCTION_ORIGIN",
  "NATIVE_PARITY",
  "RN_PARITY",
  "MERGED",
  "RELEASED",
  "PRODUCTION",
]);

export class KmpReferenceError extends Error {
  constructor(code, message) {
    super(`[${code}] ${message}`);
    this.name = "KmpReferenceError";
    this.code = code;
  }
}

const requireEqual = (actual, expected, code, field) => {
  if (actual !== expected) {
    throw new KmpReferenceError(code, `${field} must equal the pinned value`);
  }
};

const sorted = (values) => [...values].sort();

export function validateManifest(manifest) {
  requireEqual(manifest.schema_version, 1, "KMP_REFERENCE_SCHEMA_INVALID", "schema_version");
  requireEqual(manifest.reference_id, "kotlin-auto-webview-play-safe", "KMP_REFERENCE_ID_INVALID", "reference_id");

  const source = manifest.source ?? {};
  requireEqual(source.repository, PIN.repository, "KMP_REFERENCE_REPOSITORY_INVALID", "source.repository");
  requireEqual(source.repository_id, PIN.repositoryId, "KMP_REFERENCE_REPOSITORY_INVALID", "source.repository_id");
  requireEqual(source.issue, PIN.issue, "KMP_REFERENCE_SUBJECT_INVALID", "source.issue");
  requireEqual(source.pull_request, PIN.pullRequest, "KMP_REFERENCE_SUBJECT_INVALID", "source.pull_request");
  requireEqual(source.parent_commit, PIN.parentCommit, "KMP_REFERENCE_PARENT_INVALID", "source.parent_commit");
  requireEqual(source.commit, PIN.commit, "KMP_REFERENCE_COMMIT_INVALID", "source.commit");
  requireEqual(source.tree, PIN.tree, "KMP_REFERENCE_TREE_INVALID", "source.tree");
  requireEqual(source.state, PIN.state, "KMP_REFERENCE_STATE_INVALID", "source.state");
  requireEqual(source.selected_ci_run, PIN.selectedCiRun, "KMP_REFERENCE_CI_INVALID", "source.selected_ci_run");
  requireEqual(source.evidence_ceiling, PIN.upstreamCeiling, "KMP_REFERENCE_EVIDENCE_CEILING_INVALID", "source.evidence_ceiling");

  const replay = manifest.replay ?? {};
  requireEqual(replay.gradle_task, PIN.replayTask, "KMP_REFERENCE_TASK_INVALID", "replay.gradle_task");
  requireEqual(replay.maximum_claim, PIN.maximumClaim, "KMP_REFERENCE_EVIDENCE_CEILING_INVALID", "replay.maximum_claim");
  assert.deepEqual(
    sorted(replay.required_paths ?? []),
    sorted(REQUIRED_PATHS),
    "required_paths must equal the pinned source surface",
  );
  assert.deepEqual(
    sorted(manifest.claims_not_made ?? []),
    sorted(REQUIRED_NON_CLAIMS),
    "claims_not_made must preserve every non-claim",
  );

  const effects = manifest.effects ?? {};
  requireEqual(effects.source_checkout, "PUBLIC_READ_ONLY", "KMP_REFERENCE_EFFECT_INVALID", "effects.source_checkout");
  requireEqual(effects.dependency_download, "CI_ONLY", "KMP_REFERENCE_EFFECT_INVALID", "effects.dependency_download");
  requireEqual(effects.upstream_write, false, "KMP_REFERENCE_EFFECT_INVALID", "effects.upstream_write");
  requireEqual(effects.external_page_navigation, false, "KMP_REFERENCE_EFFECT_INVALID", "effects.external_page_navigation");
  requireEqual(effects.production_write, false, "KMP_REFERENCE_EFFECT_INVALID", "effects.production_write");

  return manifest;
}

export function validateCheckout(manifest, observed) {
  validateManifest(manifest);
  requireEqual(observed.commit, manifest.source.commit, "KMP_REFERENCE_COMMIT_MISMATCH", "checkout commit");
  requireEqual(observed.tree, manifest.source.tree, "KMP_REFERENCE_TREE_MISMATCH", "checkout tree");

  const present = new Set(observed.paths ?? []);
  for (const requiredPath of manifest.replay.required_paths) {
    if (!present.has(requiredPath)) {
      throw new KmpReferenceError("KMP_REFERENCE_PATH_MISSING", requiredPath);
    }
  }

  return {
    schema_version: 1,
    receipt_id: "kmp-reference-play-safe-unit-replay",
    lab_commit: observed.labCommit,
    source_repository: manifest.source.repository,
    source_commit: observed.commit,
    source_tree: observed.tree,
    source_state: manifest.source.state,
    replay_task: manifest.replay.gradle_task,
    replay_result: "PASS",
    upstream_evidence_ceiling: manifest.source.evidence_ceiling,
    maximum_claim: manifest.replay.maximum_claim,
    claims_not_made: manifest.claims_not_made,
  };
}

export const pinnedReference = PIN;
export const requiredPaths = REQUIRED_PATHS;
