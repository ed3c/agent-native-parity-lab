#!/usr/bin/env bash
# Invoked as a single command by reactivecircus/android-emulator-runner (which
# runs `script` via /usr/bin/sh / dash and rejects `set -o pipefail`).
# Keep fail-closed: never promote HOST; require validated EMULATOR envelope.
set -euo pipefail

mkdir -p evidence
adb wait-for-device
# Device shell is toybox/mksh — use POSIX [, not bash [[.
adb shell 'while [ -z "$(getprop sys.boot_completed)" ]; do sleep 1; done'

gradle :android-app:connectedDebugAndroidTest --no-daemon | tee evidence/android-emulator-instrumentation.log

# Prefer world-readable emulator tmp; fall back to run-as; then log markers.
if ! adb shell cat /data/local/tmp/android-native-runtime-envelope.json \
    > evidence/android-native-emulator-envelope.json 2>/dev/null; then
  adb shell "run-as dev.ed3c.nativeparity.checkpoint cat files/android-native-runtime-envelope.json" \
    > evidence/android-native-emulator-envelope.json 2>/dev/null || true
fi
if [ ! -s evidence/android-native-emulator-envelope.json ]; then
  adb logcat -d -s NativeParityEnvelope:I > evidence/android-emulator-logcat.txt || true
  cat evidence/android-emulator-instrumentation.log evidence/android-emulator-logcat.txt \
    > evidence/android-emulator-scrape.txt || true
  node harness/extract-marked-payload.mjs \
    ANDROID_EMU_ENVELOPE \
    evidence/android-emulator-scrape.txt \
    evidence/android-native-emulator-envelope.json
fi
test -s evidence/android-native-emulator-envelope.json
node harness/validate-runtime-envelope.mjs \
  --require-runtime-class EMULATOR \
  evidence/android-native-emulator-envelope.json
# Fail closed: never promote HOST as the primary ANDROID_NATIVE artifact.
cp evidence/android-native-emulator-envelope.json evidence/android-native-envelope.json
printf '%s\n' '{"subject":"ANDROID_NATIVE","platform":"android","status":"PASS","checkpoint_id":"exact-navigation.v1","runtime_class":"EMULATOR","reason":"managed emulator instrumentation produced validated EMULATOR envelope"}' \
  > evidence/android-native-runtime-status.json
echo "ANDROID_NATIVE ceiling candidate: SIMULATOR_RUNTIME_PARITY (emulator EMULATOR PASS)"
