import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateCheckout, validateManifest } from "./kmp-reference.mjs";

const [manifestArg, sourceArg, receiptArg] = process.argv.slice(2);
if (!manifestArg) {
  throw new Error("usage: node harness/validate-kmp-reference.mjs <manifest> [source-root] [receipt]");
}

const manifest = JSON.parse(readFileSync(resolve(manifestArg), "utf8"));
validateManifest(manifest);

if (!sourceArg) {
  console.log("KMP_REFERENCE_MANIFEST_PASS");
  process.exit(0);
}

const sourceRoot = resolve(sourceArg);
const git = (...args) => execFileSync("git", ["-C", sourceRoot, ...args], { encoding: "utf8" }).trim();
const observed = {
  commit: git("rev-parse", "HEAD"),
  tree: git("rev-parse", "HEAD^{tree}"),
  paths: manifest.replay.required_paths.filter((path) => existsSync(resolve(sourceRoot, path))),
  labCommit: process.env.LAB_HEAD_SHA ?? "NOT_BOUND",
};

const receipt = validateCheckout(manifest, observed);
if (receiptArg) {
  writeFileSync(resolve(receiptArg), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
}
console.log("KMP_REFERENCE_CHECKOUT_PASS");
