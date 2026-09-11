#!/usr/bin/env node
/**
 * Extract the first payload between <<<LABEL_BEGIN>>> and <<<LABEL_END>>> markers.
 * usage: node harness/extract-marked-payload.mjs <label> <logfile> <outfile>
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const [label, logfile, outfile] = process.argv.slice(2);
if (!label || !logfile || !outfile) {
  console.error("usage: node harness/extract-marked-payload.mjs <LABEL> <logfile> <outfile>");
  process.exit(2);
}
const text = await readFile(logfile, "utf8");
const begin = `<<<${label}_BEGIN>>>`;
const end = `<<<${label}_END>>>`;
const start = text.indexOf(begin);
const stop = text.indexOf(end, start + begin.length);
if (start < 0 || stop < 0) {
  console.error(`markers not found for ${label} in ${logfile}`);
  process.exit(1);
}
const payload = text.slice(start + begin.length, stop).trim();
if (!payload) {
  console.error(`empty payload for ${label}`);
  process.exit(1);
}
await mkdir(dirname(outfile), { recursive: true });
await writeFile(outfile, payload + "\n");
console.log(`extracted ${label} -> ${outfile} (${payload.length} bytes)`);
