import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { extractMarkedPayload } from "./extract-marked-payload.mjs";

const extractor = new URL("./extract-marked-payload.mjs", import.meta.url).pathname;
const sample = {
  subject: "IOS_NATIVE",
  platform: "ios",
  runtime_class: "SIMULATOR",
  result: "ACCEPTED",
};
const json = JSON.stringify(sample);
const b64 = Buffer.from(json, "utf8").toString("base64");

test("extracts compact JSON between BEGIN/END markers", () => {
  const log = `noise\n<<<IOS_SIM_ENVELOPE_BEGIN>>>\n${json}\n<<<IOS_SIM_ENVELOPE_END>>>\n`;
  assert.equal(extractMarkedPayload(log, "IOS_SIM_ENVELOPE"), json);
});

test("extracts JSON wrapped in xcodebuild/logcat prefixes", () => {
  const log = [
    "<<<IOS_SIM_ENVELOPE_BEGIN>>>",
    `2026-09-11T12:17:43.3993850Z I/NativeParityEnvelope( 1234): ${json}`,
    "<<<IOS_SIM_ENVELOPE_END>>>",
  ].join("\n");
  assert.equal(extractMarkedPayload(log, "IOS_SIM_ENVELOPE"), json);
});

test("extracts one-line base64 markers (prefix-safe harvest)", () => {
  const log = `ns: <<<IOS_SIM_ENVELOPE_B64>>>${b64}<<<IOS_SIM_ENVELOPE_B64_END>>>`;
  assert.equal(extractMarkedPayload(log, "IOS_SIM_ENVELOPE"), json);
});

test("CLI writes normalized JSON and fails closed when markers missing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "marked-payload-"));
  const logfile = join(dir, "xcodebuild.log");
  const outfile = join(dir, "out.json");
  await writeFile(logfile, `<<<IOS_SIM_ENVELOPE_BEGIN>>>\n${json}\n<<<IOS_SIM_ENVELOPE_END>>>\n`);
  const ok = spawnSync(process.execPath, [extractor, "IOS_SIM_ENVELOPE", logfile, outfile], {
    encoding: "utf8",
  });
  assert.equal(ok.status, 0, ok.stderr || ok.stdout);
  assert.equal(JSON.stringify(JSON.parse(await readFile(outfile, "utf8"))), json);

  const missing = spawnSync(
    process.execPath,
    [extractor, "IOS_SIM_ENVELOPE", logfile + ".missing", join(dir, "nope.json")],
    { encoding: "utf8" },
  );
  assert.notEqual(missing.status, 0);
});
