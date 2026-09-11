#!/usr/bin/env node
/**
 * Extract the first JSON payload for a marker label from a CI log.
 *
 * usage: node harness/extract-marked-payload.mjs <label> <logfile> <outfile>
 *
 * Accepts either:
 *   <<<LABEL_BEGIN>>> ...json... <<<LABEL_END>>>
 *   <<<LABEL_B64>>>base64<<<LABEL_B64_END>>>
 *
 * Guest /tmp is not visible to `simctl spawn cat` (SIMULATOR_ENVELOPE_FILE_MISSING_AFTER_XCTEST).
 * xcodebuild/adb/logcat prefixes are stripped so compact JSON still parses.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function tryParseJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed === null || typeof parsed !== "object") return null;
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

function stripLogPrefix(line) {
  return line
    .replace(/^\s*\d{4}-\d{2}-\d{2}T[^\s]+\s+/, "")
    .replace(/^\s*[0-9-]+\s+[0-9:.]+\s+\d+\s+\d+\s+[A-Z]\s+\S+:\s*/, "")
    .replace(/^\s*[A-Z]\/\S+\(\s*\d+\):\s*/, "")
    .replace(/^\s*\S+\s+\[[^\]]+\]\s+/, "")
    .trim();
}

function jsonFromSlice(slice) {
  const direct = tryParseJson(slice);
  if (direct) return direct;
  const start = slice.indexOf("{");
  const stop = slice.lastIndexOf("}");
  if (start >= 0 && stop > start) {
    const extracted = tryParseJson(slice.slice(start, stop + 1));
    if (extracted) return extracted;
  }
  const compact = slice.split(/\r?\n/).map(stripLogPrefix).join("");
  return tryParseJson(compact);
}

function decodeB64(b64) {
  try {
    const decoded = Buffer.from(String(b64).replace(/\s+/g, ""), "base64").toString("utf8");
    return jsonFromSlice(decoded) || tryParseJson(decoded);
  } catch {
    return null;
  }
}

export function extractMarkedPayload(text, labelName) {
  const b64Begin = `<<<${labelName}_B64>>>`;
  const b64End = `<<<${labelName}_B64_END>>>`;
  const b64Start = text.indexOf(b64Begin);
  const b64Stop = text.indexOf(b64End, b64Start >= 0 ? b64Start + b64Begin.length : 0);
  if (b64Start >= 0 && b64Stop > b64Start) {
    const fromB64 = decodeB64(text.slice(b64Start + b64Begin.length, b64Stop));
    if (fromB64) return fromB64;
  }

  const begin = `<<<${labelName}_BEGIN>>>`;
  const end = `<<<${labelName}_END>>>`;
  const start = text.indexOf(begin);
  const stop = text.indexOf(end, start >= 0 ? start + begin.length : 0);
  if (start < 0 || stop < 0) return null;
  return jsonFromSlice(text.slice(start + begin.length, stop));
}

async function main() {
  const [label, logfile, outfile] = process.argv.slice(2);
  if (!label || !logfile || !outfile) {
    console.error("usage: node harness/extract-marked-payload.mjs <LABEL> <logfile> <outfile>");
    process.exit(2);
  }
  const text = await readFile(logfile, "utf8");
  const payload = extractMarkedPayload(text, label);
  if (!payload) {
    console.error(`markers not found or payload not JSON for ${label} in ${logfile}`);
    process.exit(1);
  }
  await mkdir(dirname(outfile), { recursive: true });
  await writeFile(outfile, payload + "\n");
  console.log(`extracted ${label} -> ${outfile} (${payload.length} bytes)`);
}

const invokedDirectly =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) {
  await main();
}
