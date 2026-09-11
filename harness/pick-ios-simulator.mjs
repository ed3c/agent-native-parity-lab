#!/usr/bin/env node
/**
 * Print one available iPhone Simulator UDID for xcodebuild -destination.
 * Prefers Booted devices, then names containing "iPhone 16", else first iPhone.
 */
import { spawnSync } from "node:child_process";

const result = spawnSync("xcrun", ["simctl", "list", "devices", "available", "-j"], {
  encoding: "utf8",
});
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(1);
}
const data = JSON.parse(result.stdout);
const preferred = [];
const others = [];
for (const [runtime, devices] of Object.entries(data.devices || {})) {
  if (!runtime.includes("iOS")) continue;
  for (const device of devices) {
    if (device.isAvailable === false) continue;
    const name = device.name || "";
    if (!name.startsWith("iPhone")) continue;
    const entry = { name, udid: device.udid, state: device.state };
    if (name.includes("iPhone 16")) preferred.push(entry);
    else others.push(entry);
  }
}
const ordered = [...preferred, ...others];
if (ordered.length === 0) {
  console.error("no available iPhone Simulator");
  process.exit(1);
}
const booted = ordered.find((entry) => entry.state === "Booted");
const chosen = booted || ordered[0];
process.stdout.write(chosen.udid);
