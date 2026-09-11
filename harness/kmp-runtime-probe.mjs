#!/usr/bin/env node
/**
 * Probe pinned KMP checkout for an exact-navigation.v1 checkpoint surface.
 * Does not invent architecture: ABSENT/NOT_IMPLEMENTED is a valid measurement.
 */
import { createHash } from "node:crypto";
import { access, readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const PIN = Object.freeze({
  repository: "ed3c/kotlin-auto-webview",
  commit: "bcb79473eaa6bb2e09f287462aa932a7fdab4957",
  tree: "9fe624d903c429940cd8de0bd05bdf66fd63e4a1",
});

const MARKERS = Object.freeze([
  "exact-navigation.v1",
  "exact-navigation",
  "ExactNavigationCheckpoint",
  "NavigationGate",
  "CHECKPOINT_DUPLICATE_DISPATCH",
]);

async function pathExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(root, acc = []) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "build" || entry.name === ".gradle") continue;
    const full = join(root, entry.name);
    if (entry.isDirectory()) await walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function gitOutput(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function sha256File(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function findMarkerHits(kmpRoot) {
  const files = await walkFiles(kmpRoot);
  const hits = [];
  for (const file of files) {
    if (!/\.(kt|kts|swift|json|md)$/.test(file)) continue;
    let text;
    try {
      text = await readFile(file, "utf8");
    } catch {
      continue;
    }
    for (const marker of MARKERS) {
      if (text.includes(marker)) {
        hits.push({ path: relative(kmpRoot, file), marker });
      }
    }
  }
  return hits;
}

function hasCheckpointSurface(hits) {
  const paths = new Set(hits.map((hit) => hit.path));
  const hasExactNavigationArtifact = [...paths].some(
    (path) =>
      path.includes("exact-navigation") ||
      path.includes("ExactNavigation") ||
      path.endsWith("exact-navigation.v1.json"),
  );
  const hasGate = hits.some((hit) => hit.marker === "NavigationGate");
  return hasExactNavigationArtifact && hasGate;
}

const [kmpRoot, fixturePath, outPath, platform = "android"] = process.argv.slice(2);
if (!kmpRoot || !fixturePath || !outPath) {
  throw new Error(
    "usage: node harness/kmp-runtime-probe.mjs <kmp-checkout> <fixture.json> <out.json> [android|ios]",
  );
}

const commit = gitOutput(kmpRoot, ["rev-parse", "HEAD"]);
const tree = gitOutput(kmpRoot, ["rev-parse", "HEAD^{tree}"]);
if (commit !== PIN.commit || tree !== PIN.tree) {
  throw new Error(
    `KMP pin mismatch: expected ${PIN.commit}/${PIN.tree}, observed ${commit}/${tree}`,
  );
}

const fixtureRaw = await readFile(fixturePath);
const fixtureSha256 = sha256File(fixtureRaw);
const hits = await findMarkerHits(kmpRoot);
const surfacePresent = hasCheckpointSurface(hits);

await mkdir(join(outPath, ".."), { recursive: true });

if (!surfacePresent) {
  const receipt = {
    subject: "KMP_REFERENCE",
    platform,
    status: "ABSENT",
    checkpoint_id: "exact-navigation.v1",
    fixture_sha256: fixtureSha256,
    kmp_repository: PIN.repository,
    kmp_commit: commit,
    kmp_tree: tree,
    reason:
      `pinned KMP head ${commit} tree ${tree} has no exact-navigation.v1 checkpoint surface ` +
      `(no ExactNavigation/exact-navigation artifact bound to NavigationGate); ` +
      `marker_hits=${hits.length}`,
    marker_hits: hits.slice(0, 20),
    maximum_claim: "KMP_REFERENCE_CHECKPOINT_ABSENT",
  };
  await writeFile(outPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log("KMP_REFERENCE probe: ABSENT");
  process.exit(0);
}

const receipt = {
  subject: "KMP_REFERENCE",
  platform,
  status: "NOT_IMPLEMENTED",
  checkpoint_id: "exact-navigation.v1",
  fixture_sha256: fixtureSha256,
  kmp_repository: PIN.repository,
  kmp_commit: commit,
  kmp_tree: tree,
  reason:
    "checkpoint-like markers exist but this probe does not invent a KMP emitter; envelope emission remains NOT_IMPLEMENTED",
  marker_hits: hits.slice(0, 50),
  maximum_claim: "KMP_REFERENCE_SURFACE_DETECTED_EMITTER_NOT_IMPLEMENTED",
};
await writeFile(outPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log("KMP_REFERENCE probe: NOT_IMPLEMENTED");
